const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, password, familyName } = req.body;

  if (!username || !password || !familyName) {
    return res.status(400).json({ error: '请填写所有必填项' });
  }

  const checkUser = db.prepare('SELECT id FROM users WHERE username = ?');
  if (checkUser.get(username)) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const familyStmt = db.prepare('INSERT INTO families (name) VALUES (?)');
  const familyResult = familyStmt.run(familyName);
  const familyId = familyResult.lastInsertRowid;

  const userStmt = db.prepare('INSERT INTO users (username, password, family_id) VALUES (?, ?, ?)');
  const userResult = userStmt.run(username, hashedPassword, familyId);

  const token = jwt.sign({ userId: userResult.lastInsertRowid }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  res.json({
    token,
    user: {
      id: userResult.lastInsertRowid,
      username,
      familyId,
      role: 'user'
    }
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const userStmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = userStmt.get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      familyId: user.family_id,
      role: user.role
    }
  });
});

module.exports = router;
