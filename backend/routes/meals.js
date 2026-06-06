const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  const familyId = req.user.family_id;
  const { date, startDate, endDate } = req.query;
  
  if (!familyId) {
    return res.json([]);
  }
  
  let sql = 'SELECT * FROM meal_records WHERE family_id = ?';
  const params = [familyId];
  
  if (date) {
    sql += ' AND date = ?';
    params.push(date);
  } else if (startDate && endDate) {
    sql += ' AND date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }
  
  sql += ' ORDER BY date DESC, created_at DESC';
  
  const stmt = db.prepare(sql);
  const records = stmt.all(...params);
  
  const result = records.map(record => ({
    ...record,
    ingredients: record.ingredients ? JSON.parse(record.ingredients) : [],
    member_ids: record.member_ids ? JSON.parse(record.member_ids) : []
  }));
  
  res.json(result);
});

router.post('/', (req, res) => {
  const familyId = req.user.family_id;
  const { date, meal_type, recipe_id, recipe_name, ingredients, servings, member_ids } = req.body;
  
  if (!familyId) {
    return res.status(400).json({ error: '请先创建家庭' });
  }
  
  if (!date || !meal_type || !recipe_name) {
    return res.status(400).json({ error: '请填写必要信息' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO meal_records (family_id, date, meal_type, recipe_id, recipe_name, ingredients, servings, member_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    familyId,
    date,
    meal_type,
    recipe_id || null,
    recipe_name,
    JSON.stringify(ingredients || []),
    servings || 1,
    JSON.stringify(member_ids || [])
  );
  
  res.json({ id: result.lastInsertRowid, message: '记录成功' });
});

router.delete('/:id', (req, res) => {
  const familyId = req.user.family_id;
  const recordId = req.params.id;
  
  const checkStmt = db.prepare('SELECT id FROM meal_records WHERE id = ? AND family_id = ?');
  if (!checkStmt.get(recordId, familyId)) {
    return res.status(404).json({ error: '记录不存在' });
  }
  
  const stmt = db.prepare('DELETE FROM meal_records WHERE id = ? AND family_id = ?');
  stmt.run(recordId, familyId);
  
  res.json({ message: '删除成功' });
});

router.get('/nutrition/:memberId', (req, res) => {
  const familyId = req.user.family_id;
  const memberId = req.params.memberId;
  const { startDate, endDate } = req.query;
  
  if (!familyId) {
    return res.json({});
  }
  
  let sql = `
    SELECT mr.*, r.nutrition as recipe_nutrition
    FROM meal_records mr
    LEFT JOIN recipes r ON mr.recipe_id = r.id
    WHERE mr.family_id = ?
  `;
  const params = [familyId];
  
  if (startDate && endDate) {
    sql += ' AND mr.date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }
  
  const stmt = db.prepare(sql);
  const records = stmt.all(...params);
  
  const memberRecords = records.filter(record => {
    const memberIds = record.member_ids ? JSON.parse(record.member_ids) : [];
    return memberIds.includes(parseInt(memberId));
  });
  
  const totalNutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    meals: memberRecords.length
  };
  
  memberRecords.forEach(record => {
    if (record.recipe_nutrition) {
      const nutrition = JSON.parse(record.recipe_nutrition);
      const servings = record.servings || 1;
      const memberCount = record.member_ids ? JSON.parse(record.member_ids).length : 1;
      const ratio = 1 / memberCount;
      
      totalNutrition.calories += (nutrition.calories || 0) * servings * ratio;
      totalNutrition.protein += (nutrition.protein || 0) * servings * ratio;
      totalNutrition.carbs += (nutrition.carbs || 0) * servings * ratio;
      totalNutrition.fat += (nutrition.fat || 0) * servings * ratio;
      totalNutrition.fiber += (nutrition.fiber || 0) * servings * ratio;
    }
  });
  
  res.json(totalNutrition);
});

module.exports = router;
