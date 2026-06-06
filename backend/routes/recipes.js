const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const checkAllergens = (recipeIngredients, memberAllergens) => {
  if (!memberAllergens || memberAllergens.length === 0) return true;
  
  const ingredients = JSON.parse(recipeIngredients);
  const allergens = typeof memberAllergens === 'string' ? JSON.parse(memberAllergens) : memberAllergens;
  
  for (const ingredient of ingredients) {
    for (const allergen of allergens) {
      if (ingredient.name.includes(allergen) || allergen.includes(ingredient.name)) {
        return false;
      }
    }
  }
  return true;
};

router.get('/', authenticateToken, (req, res) => {
  const familyId = req.user.family_id;
  const { search, tag, filterAllergens } = req.query;
  
  let sql = 'SELECT * FROM recipes WHERE is_public = 1';
  const params = [];
  
  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (tag) {
    sql += ' AND tags LIKE ?';
    params.push(`%${tag}%`);
  }
  
  const stmt = db.prepare(sql);
  let recipes = stmt.all(...params);
  
  if (filterAllergens === 'true' && familyId) {
    const memberStmt = db.prepare('SELECT allergens FROM family_members WHERE family_id = ?');
    const members = memberStmt.all(familyId);
    
    const allAllergens = [];
    members.forEach(m => {
      if (m.allergens) {
        const allergens = JSON.parse(m.allergens);
        allAllergens.push(...allergens);
      }
    });
    
    if (allAllergens.length > 0) {
      recipes = recipes.filter(recipe => checkAllergens(recipe.ingredients, allAllergens));
    }
  }
  
  const result = recipes.map(recipe => ({
    ...recipe,
    ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients) : [],
    steps: recipe.steps ? JSON.parse(recipe.steps) : [],
    nutrition: recipe.nutrition ? JSON.parse(recipe.nutrition) : {},
    tags: recipe.tags ? JSON.parse(recipe.tags) : []
  }));
  
  res.json(result);
});

router.get('/:id', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT * FROM recipes WHERE id = ?');
  const recipe = stmt.get(req.params.id);
  
  if (!recipe) {
    return res.status(404).json({ error: '食谱不存在' });
  }
  
  res.json({
    ...recipe,
    ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients) : [],
    steps: recipe.steps ? JSON.parse(recipe.steps) : [],
    nutrition: recipe.nutrition ? JSON.parse(recipe.nutrition) : {},
    tags: recipe.tags ? JSON.parse(recipe.tags) : []
  });
});

router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { name, description, ingredients, steps, nutrition, cook_time, difficulty, tags, image } = req.body;
  
  if (!name || !ingredients) {
    return res.status(400).json({ error: '请填写食谱名称和食材' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO recipes (name, description, ingredients, steps, nutrition, cook_time, difficulty, tags, image, created_by, is_public)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  
  const result = stmt.run(
    name,
    description || '',
    JSON.stringify(ingredients),
    JSON.stringify(steps || []),
    JSON.stringify(nutrition || {}),
    cook_time || 0,
    difficulty || '简单',
    JSON.stringify(tags || []),
    image || null,
    req.user.id
  );
  
  res.json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { name, description, ingredients, steps, nutrition, cook_time, difficulty, tags, image } = req.body;
  
  const checkStmt = db.prepare('SELECT id FROM recipes WHERE id = ?');
  if (!checkStmt.get(req.params.id)) {
    return res.status(404).json({ error: '食谱不存在' });
  }
  
  const stmt = db.prepare(`
    UPDATE recipes 
    SET name = ?, description = ?, ingredients = ?, steps = ?, nutrition = ?, cook_time = ?, difficulty = ?, tags = ?, image = ?
    WHERE id = ?
  `);
  
  stmt.run(
    name,
    description || '',
    JSON.stringify(ingredients),
    JSON.stringify(steps || []),
    JSON.stringify(nutrition || {}),
    cook_time || 0,
    difficulty || '简单',
    JSON.stringify(tags || []),
    image || null,
    req.params.id
  );
  
  res.json({ message: '更新成功' });
});

router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const checkStmt = db.prepare('SELECT id FROM recipes WHERE id = ?');
  if (!checkStmt.get(req.params.id)) {
    return res.status(404).json({ error: '食谱不存在' });
  }
  
  const stmt = db.prepare('DELETE FROM recipes WHERE id = ?');
  stmt.run(req.params.id);
  
  res.json({ message: '删除成功' });
});

module.exports = router;
