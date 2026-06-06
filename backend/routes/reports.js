const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/weekly', (req, res) => {
  const familyId = req.user.family_id;
  const { weekStart } = req.query;
  
  if (!familyId) {
    return res.json({});
  }
  
  const startDate = weekStart || getWeekStart();
  const endDate = getWeekEnd(startDate);
  
  const mealStmt = db.prepare(`
    SELECT mr.*, r.nutrition as recipe_nutrition
    FROM meal_records mr
    LEFT JOIN recipes r ON mr.recipe_id = r.id
    WHERE mr.family_id = ? AND mr.date BETWEEN ? AND ?
    ORDER BY mr.date, mr.meal_type
  `);
  const meals = mealStmt.all(familyId, startDate, endDate);
  
  const memberStmt = db.prepare('SELECT * FROM family_members WHERE family_id = ?');
  const members = memberStmt.all(familyId);
  
  const memberNutrition = {};
  members.forEach(member => {
    memberNutrition[member.id] = {
      name: member.name,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      meals: 0,
      age: member.age,
      allergens: member.allergens ? JSON.parse(member.allergens) : [],
      restrictions: member.restrictions ? JSON.parse(member.restrictions) : []
    };
  });
  
  const mealsByDay = {};
  meals.forEach(meal => {
    if (!mealsByDay[meal.date]) {
      mealsByDay[meal.date] = [];
    }
    mealsByDay[meal.date].push({
      ...meal,
      ingredients: meal.ingredients ? JSON.parse(meal.ingredients) : [],
      member_ids: meal.member_ids ? JSON.parse(meal.member_ids) : []
    });
    
    const mealMemberIds = meal.member_ids ? JSON.parse(meal.member_ids) : [];
    if (mealMemberIds.length > 0 && meal.recipe_nutrition) {
      const nutrition = JSON.parse(meal.recipe_nutrition);
      const servings = meal.servings || 1;
      const ratio = 1 / mealMemberIds.length;
      
      mealMemberIds.forEach(memberId => {
        if (memberNutrition[memberId]) {
          memberNutrition[memberId].calories += (nutrition.calories || 0) * servings * ratio;
          memberNutrition[memberId].protein += (nutrition.protein || 0) * servings * ratio;
          memberNutrition[memberId].carbs += (nutrition.carbs || 0) * servings * ratio;
          memberNutrition[memberId].fat += (nutrition.fat || 0) * servings * ratio;
          memberNutrition[memberId].fiber += (nutrition.fiber || 0) * servings * ratio;
          memberNutrition[memberId].meals += 1;
        }
      });
    }
  });
  
  const suggestions = generateSuggestions(memberNutrition, members);
  
  res.json({
    weekStart: startDate,
    weekEnd: endDate,
    mealsByDay,
    memberNutrition,
    suggestions,
    totalMeals: meals.length
  });
});

router.get('/dashboard', (req, res) => {
  const familyId = req.user.family_id;
  
  if (!familyId) {
    return res.json({});
  }
  
  const startDate = getWeekStart();
  const endDate = getWeekEnd(startDate);
  
  const mealStmt = db.prepare(`
    SELECT mr.*, r.nutrition as recipe_nutrition
    FROM meal_records mr
    LEFT JOIN recipes r ON mr.recipe_id = r.id
    WHERE mr.family_id = ? AND mr.date BETWEEN ? AND ?
  `);
  const meals = mealStmt.all(familyId, startDate, endDate);
  
  const memberStmt = db.prepare('SELECT * FROM family_members WHERE family_id = ?');
  const members = memberStmt.all(familyId);
  
  const dailyStats = {};
  const memberNutrition = {};
  
  members.forEach(member => {
    memberNutrition[member.id] = {
      name: member.name,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      meals: 0
    };
  });
  
  meals.forEach(meal => {
    if (!dailyStats[meal.date]) {
      dailyStats[meal.date] = { meals: 0, calories: 0 };
    }
    dailyStats[meal.date].meals += 1;
    
    const mealMemberIds = meal.member_ids ? JSON.parse(meal.member_ids) : [];
    if (mealMemberIds.length > 0 && meal.recipe_nutrition) {
      const nutrition = JSON.parse(meal.recipe_nutrition);
      const servings = meal.servings || 1;
      const ratio = 1 / mealMemberIds.length;
      
      dailyStats[meal.date].calories += (nutrition.calories || 0) * servings;
      
      mealMemberIds.forEach(memberId => {
        if (memberNutrition[memberId]) {
          memberNutrition[memberId].calories += (nutrition.calories || 0) * servings * ratio;
          memberNutrition[memberId].protein += (nutrition.protein || 0) * servings * ratio;
          memberNutrition[memberId].carbs += (nutrition.carbs || 0) * servings * ratio;
          memberNutrition[memberId].fat += (nutrition.fat || 0) * servings * ratio;
          memberNutrition[memberId].fiber += (nutrition.fiber || 0) * servings * ratio;
          memberNutrition[memberId].meals += 1;
        }
      });
    }
  });
  
  const nutrientAlerts = generateNutrientAlerts(memberNutrition, members);
  
  res.json({
    weekStart: startDate,
    weekEnd: endDate,
    dailyStats,
    memberNutrition,
    nutrientAlerts,
    totalMeals: meals.length,
    memberCount: members.length
  });
});

function getWeekStart() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function getWeekEnd(startDate) {
  const start = new Date(startDate);
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  return end.toISOString().split('T')[0];
}

function generateNutrientAlerts(memberNutrition, members) {
  const alerts = [];
  
  Object.entries(memberNutrition).forEach(([memberId, data]) => {
    const member = members.find(m => m.id == memberId);
    if (!member) return;
    
    const age = member.age || 30;
    const expectedCalories = age < 18 ? 1800 : (age < 60 ? 2200 : 1800);
    const expectedProtein = age < 18 ? 50 : (age < 60 ? 60 : 50);
    const expectedFiber = 25;
    
    if (data.meals > 0) {
      const days = 7;
      const avgCalories = data.calories / days;
      const avgProtein = data.protein / days;
      const avgFiber = data.fiber / days;
      
      if (avgCalories < expectedCalories * 0.7) {
        alerts.push({
          member: data.name,
          type: 'calories',
          message: `热量摄入偏低，建议增加高能量食物`,
          current: Math.round(avgCalories),
          expected: expectedCalories
        });
      }
      
      if (avgProtein < expectedProtein * 0.7) {
        alerts.push({
          member: data.name,
          type: 'protein',
          message: `蛋白质摄入不足，建议多吃肉蛋奶类食物`,
          current: avgProtein.toFixed(1),
          expected: expectedProtein
        });
      }
      
      if (avgFiber < expectedFiber * 0.6) {
        alerts.push({
          member: data.name,
          type: 'fiber',
          message: `膳食纤维摄入不足，建议多吃蔬菜水果`,
          current: avgFiber.toFixed(1),
          expected: expectedFiber
        });
      }
    }
  });
  
  return alerts;
}

function generateSuggestions(memberNutrition, members) {
  const suggestions = [];
  
  Object.entries(memberNutrition).forEach(([memberId, data]) => {
    const memberSuggestions = [];
    
    if (data.meals === 0) {
      memberSuggestions.push('本周暂无饮食记录，建议开始记录饮食情况');
    } else {
      if (data.protein < 300) {
        memberSuggestions.push('蛋白质摄入偏低，建议增加鱼、肉、蛋、奶等高蛋白食物');
      }
      if (data.fiber < 150) {
        memberSuggestions.push('膳食纤维摄入不足，建议多吃蔬菜、水果和全谷物');
      }
      if (data.fat > 400) {
        memberSuggestions.push('脂肪摄入偏高，建议选择低脂烹饪方式，减少油炸食品');
      }
      if (memberSuggestions.length === 0) {
        memberSuggestions.push('营养摄入均衡，继续保持良好的饮食习惯！');
      }
    }
    
    if (memberSuggestions.length > 0) {
      suggestions.push({
        member: data.name,
        suggestions: memberSuggestions
      });
    }
  });
  
  return suggestions;
}

module.exports = router;
