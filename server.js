const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3001; // Запуск на порту 3001, чтобы не пересекаться с основным проектом

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === АПИ Сессий ===

app.post('/api/session/start', (req, res) => {
  const { sessionId, userName } = req.body;
  
  if (sessionId) {
    db.get('SELECT * FROM sessions WHERE id = ?', [sessionId], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) {
        if (userName && row.user_name !== userName) {
          db.run('UPDATE sessions SET user_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [userName, sessionId]);
        }
        let answers = [];
        try { answers = JSON.parse(row.answers || '[]'); } catch (e) {}
        
        return res.json({
          sessionId: row.id,
          userName: userName || row.user_name,
          currentQuestion: row.current_q,
          status: row.status,
          answers: answers
        });
      }
      createNewSession(res, userName);
    });
  } else {
    createNewSession(res, userName);
  }
});

function createNewSession(res, userName) {
  const newSessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  db.run(
    'INSERT INTO sessions (id, user_name, current_q, status, answers) VALUES (?, ?, 0, "active", "[]")',
    [newSessionId, userName || null],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        sessionId: newSessionId,
        userName: userName || null,
        currentQuestion: 0,
        status: 'active',
        answers: []
      });
    }
  );
}

const TOTAL_QUESTIONS = 20;

app.post('/api/answer', (req, res) => {
  const { sessionId, answer } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  db.get('SELECT * FROM sessions WHERE id = ?', [sessionId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Session not found' });
    if (row.status === 'finished') return res.json({ status: 'finished' });

    let answers = [];
    try { answers = JSON.parse(row.answers || '[]'); } catch (e) {}
    
    const currentQ = row.current_q;
    answers[currentQ] = answer;
    
    const nextQ = currentQ + 1;
    let newStatus = 'active';
    
    if (nextQ >= TOTAL_QUESTIONS) {
      newStatus = 'finished';
    }

    db.run(
      'UPDATE sessions SET current_q = ?, status = ?, answers = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nextQ, newStatus, JSON.stringify(answers), sessionId],
      (updateErr) => {
        if (updateErr) return res.status(500).json({ error: updateErr.message });
        res.json({
          status: newStatus,
          nextQuestion: nextQ
        });
      }
    );
  });
});

app.post('/api/click', (req, res) => {
  const { sessionId, linkType } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
  db.run('INSERT INTO clicks (session_id, link_type) VALUES (?, ?)', [sessionId, linkType || 'admin'], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// === АДМИНКА ===

app.get('/api/admin/stats', (req, res) => {
  const stats = {};
  db.get(`SELECT COUNT(*) as count FROM sessions`, (err, row) => { stats.totalSessions = row?.count || 0; });
  db.get(`SELECT COUNT(*) as count FROM sessions WHERE status = 'finished'`, (err, row) => { stats.finishedSessions = row?.count || 0; });
  db.get(`SELECT COUNT(*) as count FROM sessions WHERE status = 'active'`, (err, row) => { stats.notFinishedSessions = row?.count || 0; });
  
  setTimeout(() => res.json(stats), 100);
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/admin/recent', (req, res) => {
  db.all('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 1000', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/session/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM sessions WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    let answers = [];
    try { answers = JSON.parse(row.answers || '[]'); } catch (e) {}
    row.answers = answers;
    res.json(row);
  });
});

app.get('/api/admin/export', (req, res) => {
  const { format } = req.query;
  db.all('SELECT * FROM sessions ORDER BY created_at DESC', (err, sessions) => {
    if (err) return res.status(500).json({ error: err.message });
    if (format === 'csv') {
      function csvCell(val) {
        if (val === null || val === undefined) return '';
        const str = Array.isArray(val) ? val.join(' | ') : String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }
      const qHeaders = Array.from({ length: 20 }, (_, i) => `Q${i + 1}`);
      const baseHeaders = ['ID', 'Ном', 'Сана', 'Пешрафт', 'Статус'];
      let csv = [...baseHeaders, ...qHeaders].map(csvCell).join(',') + '\n';

      sessions.forEach(s => {
        let answers = [];
        try { answers = JSON.parse(s.answers || '[]'); } catch (e) {}
        const base = [
          s.id, s.user_name || '', s.created_at || '', `${s.current_q}/20`,
          s.status === 'finished' ? 'Завершён' : 'Активен'
        ];
        const qAnswers = Array.from({ length: 20 }, (_, i) => {
          const ans = answers[i];
          if (ans === undefined || ans === null) return '';
          if (Array.isArray(ans)) return ans.join(' | ');
          return String(ans);
        });
        csv += [...base, ...qAnswers].map(csvCell).join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=anketa_export.csv');
      res.send('\uFEFF' + csv);
    } else {
      const result = sessions.map(s => {
        let answers = [];
        try { answers = JSON.parse(s.answers || '[]'); } catch (e) {}
        return { ...s, answers };
      });
      res.json(result);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Anketa Server is running on port ${PORT}`);
});
