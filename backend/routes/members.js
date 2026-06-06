const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

const generateDietTags = (member) => {
  const tags = [];
  
  if (member.age !== null && member.age !== undefined) {
    if (member.age < 12) tags.push('儿童');
    else if (member.age >= 12 && member.age < 18) tags.push('青少年');
    else if (member.age >= 18 && member.age < 60) tags.push('成人');
    else tags.push('老年人');
  }
  
  if (member.allergens && member.allergens.length > 0) {
    tags.push('有过敏源');
  }
  
  if (member.restrictions && member.restrictions.length > 0) {
    const restrictions = JSON.parse(member.restrictions);
    restrictions.forEach(r => {
      if (r.includes('素食') || r.includes('vegan')) tags.push('素食');
      if (r.includes('低脂')) tags.push('低脂');
      if (r.includes('低盐')) tags.push('低盐');
      if (r.includes('低糖')) tags.push('低糖');
      if (r.includes('清真')) tags.push('清真');
    });
  }
  
  return tags;
};

router.get('/', (req, res) => {
  const familyId = req.user.family_id;
  
  if (!familyId) {
    return res.json([]);
  }
  
  const stmt = db.prepare('SELECT * FROM family_members WHERE family_id = ? ORDER BY created_at DESC');
  const members = stmt.all(familyId);
  
  const result = members.map(member => ({
    ...member,
    allergens: member.allergens ? JSON.parse(member.allergens) : [],
    restrictions: member.restrictions ? JSON.parse(member.restrictions) : [],
    diet_tags: member.diet_tags ? JSON.parse(member.diet_tags) : []
  }));
  
  res.json(result);
});

router.post('/', (req, res) => {
  const familyId = req.user.family_id;
  const { name, age, gender, allergens, restrictions, avatar } = req.body;
  
  if (!familyId) {
    return res.status(400).json({ error: '请先创建家庭' });
  }
  
  if (!name) {
    return res.status(400).json({ error: '请输入姓名' });
  }
  
  const allergensJson = allergens ? JSON.stringify(allergens) : '[]';
  const restrictionsJson = restrictions ? JSON.stringify(restrictions) : '[]';
  
  const tempMember = { age, allergens: allergensJson, restrictions: restrictionsJson };
  const dietTags = generateDietTags(tempMember);
  const dietTagsJson = JSON.stringify(dietTags);
  
  const stmt = db.prepare(`
    INSERT INTO family_members (family_id, name, age, gender, allergens, restrictions, diet_tags, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(familyId, name, age, gender, allergensJson, restrictionsJson, dietTagsJson, avatar || null);
  
  res.json({
    id: result.lastInsertRowid,
    name,
    age,
    gender,
    allergens,
    restrictions,
    diet_tags: dietTags,
    avatar
  });
});

router.put('/:id', (req, res) => {
  const familyId = req.user.family_id;
  const memberId = req.params.id;
  const { name, age, gender, allergens, restrictions, avatar } = req.body;
  
  const checkStmt = db.prepare('SELECT id FROM family_members WHERE id = ? AND family_id = ?');
  if (!checkStmt.get(memberId, familyId)) {
    return res.status(404).json({ error: '家庭成员不存在' });
  }
  
  const allergensJson = allergens ? JSON.stringify(allergens) : '[]';
  const restrictionsJson = restrictions ? JSON.stringify(restrictions) : '[]';
  
  const tempMember = { age, allergens: allergensJson, restrictions: restrictionsJson };
  const dietTags = generateDietTags(tempMember);
  const dietTagsJson = JSON.stringify(dietTags);
  
  const stmt = db.prepare(`
    UPDATE family_members 
    SET name = ?, age = ?, gender = ?, allergens = ?, restrictions = ?, diet_tags = ?, avatar = ?
    WHERE id = ? AND family_id = ?
  `);
  
  stmt.run(name, age, gender, allergensJson, restrictionsJson, dietTagsJson, avatar || null, memberId, familyId);
  
  res.json({ message: '更新成功' });
});

router.delete('/:id', (req, res) => {
  const familyId = req.user.family_id;
  const memberId = req.params.id;
  
  const checkStmt = db.prepare('SELECT id FROM family_members WHERE id = ? AND family_id = ?');
  if (!checkStmt.get(memberId, familyId)) {
    return res.status(404).json({ error: '家庭成员不存在' });
  }
  
  const stmt = db.prepare('DELETE FROM family_members WHERE id = ? AND family_id = ?');
  stmt.run(memberId, familyId);
  
  res.json({ message: '删除成功' });
});

module.exports = router;
