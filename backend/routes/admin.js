const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken, requireAdmin);

router.get('/users', (req, res) => {
  const stmt = db.prepare(`
    SELECT u.id, u.username, u.role, u.family_id, u.created_at, f.name as family_name
    FROM users u
    LEFT JOIN families f ON u.family_id = f.id
    ORDER BY u.created_at DESC
  `);
  const users = stmt.all();
  res.json(users);
});

router.get('/families', (req, res) => {
  const stmt = db.prepare(`
    SELECT f.*, 
           (SELECT COUNT(*) FROM family_members WHERE family_id = f.id) as member_count,
           (SELECT COUNT(*) FROM users WHERE family_id = f.id) as user_count
    FROM families f
    ORDER BY f.created_at DESC
  `);
  const families = stmt.all();
  res.json(families);
});

router.get('/recipes', (req, res) => {
  const stmt = db.prepare('SELECT * FROM recipes ORDER BY created_at DESC');
  const recipes = stmt.all();
  
  const result = recipes.map(recipe => ({
    ...recipe,
    ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients) : [],
    tags: recipe.tags ? JSON.parse(recipe.tags) : []
  }));
  
  res.json(result);
});

router.get('/stats', (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const familyCount = db.prepare('SELECT COUNT(*) as count FROM families').get().count;
  const recipeCount = db.prepare('SELECT COUNT(*) as count FROM recipes').get().count;
  const mealCount = db.prepare('SELECT COUNT(*) as count FROM meal_records').get().count;
  
  res.json({
    userCount,
    familyCount,
    recipeCount,
    mealCount
  });
});

module.exports = router;
