const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'data', 'diet.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    family_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS families (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    allergens TEXT,
    restrictions TEXT,
    diet_tags TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id)
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    ingredients TEXT NOT NULL,
    steps TEXT,
    nutrition TEXT,
    cook_time INTEGER,
    difficulty TEXT,
    tags TEXT,
    image TEXT,
    created_by INTEGER,
    is_public INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meal_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL,
    recipe_id INTEGER,
    recipe_name TEXT NOT NULL,
    ingredients TEXT,
    servings INTEGER DEFAULT 1,
    member_ids TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
  );

  CREATE TABLE IF NOT EXISTS shopping_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id)
  );

  CREATE TABLE IF NOT EXISTS shopping_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shopping_list_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    unit TEXT,
    is_purchased INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shopping_list_id) REFERENCES shopping_lists(id)
  );

  CREATE TABLE IF NOT EXISTS weekly_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    week_start DATE NOT NULL,
    plan_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id)
  );

  CREATE TABLE IF NOT EXISTS nutrition_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    calories INTEGER,
    protein REAL,
    carbs REAL,
    fat REAL,
    fiber REAL,
    vitamins TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES family_members(id)
  );
`);

const adminPassword = bcrypt.hashSync('admin123', 10);
const stmt = db.prepare('INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)');
stmt.run('admin', adminPassword, 'admin');

const sampleRecipes = [
  {
    name: '西红柿炒鸡蛋',
    description: '经典家常菜，营养丰富',
    ingredients: JSON.stringify([
      { name: '西红柿', amount: 200, unit: 'g' },
      { name: '鸡蛋', amount: 2, unit: '个' },
      { name: '葱', amount: 10, unit: 'g' },
      { name: '盐', amount: 3, unit: 'g' },
      { name: '食用油', amount: 15, unit: 'ml' }
    ]),
    steps: JSON.stringify(['西红柿切块', '鸡蛋打散', '炒蛋盛出', '炒西红柿', '混合调味']),
    nutrition: JSON.stringify({ calories: 250, protein: 15, carbs: 12, fat: 18, fiber: 2 }),
    cook_time: 15,
    difficulty: '简单',
    tags: JSON.stringify(['家常菜', '快手菜', '素食可选'])
  },
  {
    name: '清炒西兰花',
    description: '健康蔬菜，富含维生素',
    ingredients: JSON.stringify([
      { name: '西兰花', amount: 300, unit: 'g' },
      { name: '蒜', amount: 10, unit: 'g' },
      { name: '盐', amount: 3, unit: 'g' },
      { name: '食用油', amount: 10, unit: 'ml' }
    ]),
    steps: JSON.stringify(['西兰花切朵焯水', '爆香蒜末', '快炒西兰花', '调味出锅']),
    nutrition: JSON.stringify({ calories: 120, protein: 6, carbs: 15, fat: 5, fiber: 8 }),
    cook_time: 10,
    difficulty: '简单',
    tags: JSON.stringify(['素菜', '低脂', '高纤维'])
  },
  {
    name: '红烧排骨',
    description: '经典肉菜，味道浓郁',
    ingredients: JSON.stringify([
      { name: '排骨', amount: 500, unit: 'g' },
      { name: '姜', amount: 15, unit: 'g' },
      { name: '葱', amount: 15, unit: 'g' },
      { name: '酱油', amount: 30, unit: 'ml' },
      { name: '料酒', amount: 20, unit: 'ml' },
      { name: '糖', amount: 10, unit: 'g' }
    ]),
    steps: JSON.stringify(['排骨焯水', '爆香葱姜', '翻炒排骨', '调味焖煮', '收汁出锅']),
    nutrition: JSON.stringify({ calories: 450, protein: 35, carbs: 8, fat: 30, fiber: 1 }),
    cook_time: 60,
    difficulty: '中等',
    tags: JSON.stringify(['荤菜', '下饭', '高蛋白'])
  },
  {
    name: '香菇滑鸡',
    description: '鲜嫩多汁，营养均衡',
    ingredients: JSON.stringify([
      { name: '鸡胸肉', amount: 300, unit: 'g' },
      { name: '香菇', amount: 100, unit: 'g' },
      { name: '青椒', amount: 50, unit: 'g' },
      { name: '蒜', amount: 10, unit: 'g' },
      { name: '生抽', amount: 20, unit: 'ml' },
      { name: '淀粉', amount: 10, unit: 'g' }
    ]),
    steps: JSON.stringify(['鸡肉腌制', '香菇切片', '滑炒鸡肉', '炒香配料', '混合勾芡']),
    nutrition: JSON.stringify({ calories: 320, protein: 40, carbs: 10, fat: 12, fiber: 3 }),
    cook_time: 25,
    difficulty: '中等',
    tags: JSON.stringify(['荤菜', '高蛋白', '低脂'])
  },
  {
    name: '蒜蓉菠菜',
    description: '快手素菜，补铁佳品',
    ingredients: JSON.stringify([
      { name: '菠菜', amount: 300, unit: 'g' },
      { name: '蒜', amount: 15, unit: 'g' },
      { name: '盐', amount: 3, unit: 'g' },
      { name: '食用油', amount: 10, unit: 'ml' }
    ]),
    steps: JSON.stringify(['菠菜洗净', '爆香蒜末', '快炒菠菜', '调味出锅']),
    nutrition: JSON.stringify({ calories: 80, protein: 5, carbs: 10, fat: 3, fiber: 6 }),
    cook_time: 8,
    difficulty: '简单',
    tags: JSON.stringify(['素菜', '快手菜', '补铁'])
  },
  {
    name: '牛奶燕麦粥',
    description: '营养早餐，健康饱腹',
    ingredients: JSON.stringify([
      { name: '燕麦片', amount: 50, unit: 'g' },
      { name: '牛奶', amount: 250, unit: 'ml' },
      { name: '蜂蜜', amount: 10, unit: 'g' }
    ]),
    steps: JSON.stringify(['燕麦加水煮软', '加入牛奶', '加蜂蜜调味']),
    nutrition: JSON.stringify({ calories: 280, protein: 12, carbs: 45, fat: 6, fiber: 5 }),
    cook_time: 10,
    difficulty: '简单',
    tags: JSON.stringify(['早餐', '健康', '高纤维'])
  }
];

const recipeStmt = db.prepare(`
  INSERT OR IGNORE INTO recipes (name, description, ingredients, steps, nutrition, cook_time, difficulty, tags)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

sampleRecipes.forEach(recipe => {
  recipeStmt.run(
    recipe.name,
    recipe.description,
    recipe.ingredients,
    recipe.steps,
    recipe.nutrition,
    recipe.cook_time,
    recipe.difficulty,
    recipe.tags
  );
});

console.log('数据库初始化完成！');
console.log('默认管理员账号: admin / admin123');

db.close();
