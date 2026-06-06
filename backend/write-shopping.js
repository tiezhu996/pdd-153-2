const fs = require('fs');
const path = require('path');

const content = `const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/lists', (req, res) => {
  const familyId = req.user.family_id;
  
  if (!familyId) {
    return res.json([]);
  }
  
  const stmt = db.prepare('SELECT * FROM shopping_lists WHERE family_id = ? ORDER BY created_at DESC');
  const lists = stmt.all(familyId);
  
  res.json(lists);
});

router.get('/lists/:id/items', (req, res) => {
  const familyId = req.user.family_id;
  const listId = req.params.id;
  
  if (!familyId) {
    return res.json([]);
  }
  
  const checkStmt = db.prepare('SELECT id FROM shopping_lists WHERE id = ? AND family_id = ?');
  if (!checkStmt.get(listId, familyId)) {
    return res.status(404).json({ error: '购物清单不存在' });
  }
  
  const stmt = db.prepare('SELECT * FROM shopping_items WHERE shopping_list_id = ? ORDER BY created_at');
  const items = stmt.all(listId);
  
  res.json(items);
});

router.post('/lists', (req, res) => {
  const familyId = req.user.family_id;
  const { name, start_date, end_date } = req.body;
  
  if (!familyId) {
    return res.status(400).json({ error: '请先创建家庭' });
  }
  
  if (!name) {
    return res.status(400).json({ error: '请输入清单名称' });
  }
  
  const stmt = db.prepare(\`
    INSERT INTO shopping_lists (family_id, name, start_date, end_date)
    VALUES (?, ?, ?, ?)
  \`);
  
  const result = stmt.run(familyId, name, start_date || null, end_date || null);
  
  res.json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.post('/lists/:id/items', (req, res) => {
  const familyId = req.user.family_id;
  const listId = req.params.id;
  const { name, quantity, unit } = req.body;
  
  const checkStmt = db.prepare('SELECT id FROM shopping_lists WHERE id = ? AND family_id = ?');
  if (!checkStmt.get(listId, familyId)) {
    return res.status(404).json({ error: '购物清单不存在' });
  }
  
  if (!name) {
    return res.status(400).json({ error: '请输入物品名称' });
  }
  
  const stmt = db.prepare(\`
    INSERT INTO shopping_items (shopping_list_id, name, quantity, unit)
    VALUES (?, ?, ?, ?)
  \`);
  
  const result = stmt.run(listId, name, quantity || 1, unit || '');
  
  res.json({ id: result.lastInsertRowid, message: '添加成功' });
});

router.put('/items/:id', (req, res) => {
  const familyId = req.user.family_id;
  const itemId = req.params.id;
  const { name, quantity, unit, is_purchased } = req.body;
  
  const checkStmt = db.prepare(\`
    SELECT si.id FROM shopping_items si
    JOIN shopping_lists sl ON si.shopping_list_id = sl.id
    WHERE si.id = ? AND sl.family_id = ?
  \`);
  if (!checkStmt.get(itemId, familyId)) {
    return res.status(404).json({ error: '物品不存在' });
  }
  
  const stmt = db.prepare(\`
    UPDATE shopping_items 
    SET name = ?, quantity = ?, unit = ?, is_purchased = ?
    WHERE id = ?
  \`);
  
  stmt.run(name, quantity || 1, unit || '', is_purchased ? 1 : 0, itemId);
  
  res.json({ message: '更新成功' });
});

router.delete('/items/:id', (req, res) => {
  const familyId = req.user.family_id;
  const itemId = req.params.id;
  
  const checkStmt = db.prepare(\`
    SELECT si.id FROM shopping_items si
    JOIN shopping_lists sl ON si.shopping_list_id = sl.id
    WHERE si.id = ? AND sl.family_id = ?
  \`);
  if (!checkStmt.get(itemId, familyId)) {
    return res.status(404).json({ error: '物品不存在' });
  }
  
  const stmt = db.prepare('DELETE FROM shopping_items WHERE id = ?');
  stmt.run(itemId);
  
  res.json({ message: '删除成功' });
});

router.delete('/lists/:id', (req, res) => {
  const familyId = req.user.family_id;
  const listId = req.params.id;
  
  const checkStmt = db.prepare('SELECT id FROM shopping_lists WHERE id = ? AND family_id = ?');
  if (!checkStmt.get(listId, familyId)) {
    return res.status(404).json({ error: '购物清单不存在' });
  }
  
  db.prepare('DELETE FROM shopping_items WHERE shopping_list_id = ?').run(listId);
  db.prepare('DELETE FROM shopping_lists WHERE id = ?').run(listId);
  
  res.json({ message: '删除成功' });
});

router.post('/generate-from-plan', (req, res) => {
  const familyId = req.user.family_id;
  const { planData, listName } = req.body;
  
  if (!familyId) {
    return res.status(400).json({ error: '请先创建家庭' });
  }
  
  const ingredientsMap = new Map();
  
  Object.values(planData || {}).forEach(day => {
    Object.values(day || {}).forEach(recipe => {
      if (recipe && recipe.ingredients) {
        recipe.ingredients.forEach(ing => {
          const key = \`\${ing.name}_\${ing.unit || ''}\`;
          if (ingredientsMap.has(key)) {
            const existing = ingredientsMap.get(key);
            existing.amount += ing.amount || 1;
          } else {
            ingredientsMap.set(key, { ...ing });
          }
        });
      }
    });
  });
  
  const listStmt = db.prepare(\`
    INSERT INTO shopping_lists (family_id, name, status)
    VALUES (?, ?, 'active')
  \`);
  const listResult = listStmt.run(familyId, listName || '自动生成购物清单');
  const listId = listResult.lastInsertRowid;
  
  const itemStmt = db.prepare(\`
    INSERT INTO shopping_items (shopping_list_id, name, quantity, unit)
    VALUES (?, ?, ?, ?)
  \`);
  
  ingredientsMap.forEach(ing => {
    itemStmt.run(listId, ing.name, ing.amount || 1, ing.unit || '');
  });
  
  res.json({ listId, message: '生成成功' });
});

router.post('/generate-from-meals', (req, res) => {
  const familyId = req.user.family_id;
  const { start_date, end_date, list_name, list_id } = req.body;

  if (!familyId) {
    return res.status(400).json({ error: '请先创建家庭' });
  }
  if (!start_date || !end_date) {
    return res.status(400).json({ error: '请指定开始和结束日期' });
  }

  const mealStmt = db.prepare(\`
    SELECT ingredients, servings FROM meal_records
    WHERE family_id = ? AND date BETWEEN ? AND ?
  \`);
  const meals = mealStmt.all(familyId, start_date, end_date);

  const ingredientsMap = new Map();
  let mealCount = 0;

  meals.forEach(meal => {
    if (!meal.ingredients) return;
    mealCount++;
    let ingredients;
    try {
      ingredients = JSON.parse(meal.ingredients);
    } catch (e) {
      return;
    }
    const servings = meal.servings || 1;
    ingredients.forEach(ing => {
      const name = (ing.name || '').trim();
      if (!name) return;
      const unit = ing.unit || '';
      const key = \`\${name}_\${unit}\`;
      const amount = (ing.amount || ing.quantity || 1) * servings;
      if (ingredientsMap.has(key)) {
        ingredientsMap.get(key).amount += amount;
      } else {
        ingredientsMap.set(key, { name, unit, amount });
      }
    });
  });

  let targetListId = list_id;
  let createdNew = false;

  if (!targetListId) {
    const activeListStmt = db.prepare(\`
      SELECT id FROM shopping_lists
      WHERE family_id = ? AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    \`);
    const activeList = activeListStmt.get(familyId);
    if (activeList) {
      targetListId = activeList.id;
    }
  }

  if (!targetListId) {
    const defaultName = list_name || \`\${start_date} ~ \${end_date} 食材清单\`;
    const listStmt = db.prepare(\`
      INSERT INTO shopping_lists (family_id, name, status, start_date, end_date)
      VALUES (?, ?, 'active', ?, ?)
    \`);
    const result = listStmt.run(familyId, defaultName, start_date, end_date);
    targetListId = result.lastInsertRowid;
    createdNew = true;
  } else {
    if (list_name) {
      db.prepare('UPDATE shopping_lists SET name = ?, start_date = ?, end_date = ? WHERE id = ?')
        .run(list_name, start_date, end_date, targetListId);
    }
  }

  const existingItemsStmt = db.prepare(\`
    SELECT id, name, unit, quantity, is_purchased FROM shopping_items
    WHERE shopping_list_id = ?
  \`);
  const existingItems = existingItemsStmt.all(targetListId);
  const existingMap = new Map();
  existingItems.forEach(item => {
    const key = \`\${item.name}_\${item.unit || ''}\`;
    existingMap.set(key, item);
  });

  const updateStmt = db.prepare(\`
    UPDATE shopping_items SET quantity = ? WHERE id = ?
  \`);
  const insertStmt = db.prepare(\`
    INSERT INTO shopping_items (shopping_list_id, name, quantity, unit)
    VALUES (?, ?, ?, ?)
  \`);

  let mergedCount = 0;
  let addedCount = 0;

  ingredientsMap.forEach(ing => {
    const key = \`\${ing.name}_\${ing.unit}\`;
    if (existingMap.has(key)) {
      const existing = existingMap.get(key);
      const newQty = (existing.quantity || 0) + ing.amount;
      updateStmt.run(newQty, existing.id);
      mergedCount++;
    } else {
      insertStmt.run(targetListId, ing.name, ing.amount, ing.unit);
      addedCount++;
    }
  });

  const allItemsStmt = db.prepare(\`
    SELECT id, is_purchased FROM shopping_items WHERE shopping_list_id = ?
  \`);
  const allItems = allItemsStmt.all(targetListId);
  const purchasedCount = allItems.filter(i => i.is_purchased).length;

  res.json({
    listId: targetListId,
    createdNew,
    mealCount,
    ingredientKinds: ingredientsMap.size,
    mergedCount,
    addedCount,
    purchasedCount,
    totalCount: allItems.length,
    message: createdNew ? '已生成新购物清单' : '已合并到现有购物清单'
  });
});

module.exports = router;
`;

const targetPath = path.join(__dirname, 'routes', 'shopping.js');
fs.writeFileSync(targetPath, content, 'utf8');
console.log('File written successfully:', targetPath);
console.log('Lines:', content.split('\n').length);
