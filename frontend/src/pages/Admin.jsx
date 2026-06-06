import { useState, useEffect } from 'react';
import axios from 'axios';

function Admin() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    description: '',
    cook_time: 15,
    difficulty: '简单',
    ingredients: [{ name: '', amount: '', unit: 'g' }],
    steps: [''],
    tags: [],
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  });

  const commonTags = ['家常菜', '快手菜', '素菜', '荤菜', '低脂', '高蛋白', '高纤维', '早餐'];
  const difficulties = ['简单', '中等', '困难'];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') {
        const res = await axios.get('/api/admin/stats');
        setStats(res.data);
      } else if (activeTab === 'users') {
        const res = await axios.get('/api/admin/users');
        setUsers(res.data);
      } else if (activeTab === 'families') {
        const res = await axios.get('/api/admin/families');
        setFamilies(res.data);
      } else if (activeTab === 'recipes') {
        const res = await axios.get('/api/admin/recipes');
        setRecipes(res.data);
      }
    } catch (err) {
      console.error('获取数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeSubmit = async (e) => {
    e.preventDefault();
    
    const data = {
      ...recipeForm,
      ingredients: recipeForm.ingredients.filter(i => i.name),
      steps: recipeForm.steps.filter(s => s)
    };

    try {
      if (editingRecipe) {
        await axios.put(`/api/recipes/${editingRecipe.id}`, data);
      } else {
        await axios.post('/api/recipes', data);
      }
      fetchData();
      closeRecipeModal();
    } catch (err) {
      alert('保存失败');
    }
  };

  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setRecipeForm({
      name: recipe.name,
      description: recipe.description || '',
      cook_time: recipe.cook_time || 15,
      difficulty: recipe.difficulty || '简单',
      ingredients: recipe.ingredients?.length > 0 ? recipe.ingredients : [{ name: '', amount: '', unit: 'g' }],
      steps: recipe.steps?.length > 0 ? recipe.steps : [''],
      tags: recipe.tags || [],
      nutrition: recipe.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    });
    setShowRecipeModal(true);
  };

  const handleDeleteRecipe = async (id) => {
    if (confirm('确定要删除这个食谱吗？')) {
      try {
        await axios.delete(`/api/recipes/${id}`);
        fetchData();
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  const closeRecipeModal = () => {
    setShowRecipeModal(false);
    setEditingRecipe(null);
    setRecipeForm({
      name: '',
      description: '',
      cook_time: 15,
      difficulty: '简单',
      ingredients: [{ name: '', amount: '', unit: 'g' }],
      steps: [''],
      tags: [],
      nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    });
  };

  const addIngredient = () => {
    setRecipeForm({
      ...recipeForm,
      ingredients: [...recipeForm.ingredients, { name: '', amount: '', unit: 'g' }]
    });
  };

  const removeIngredient = (index) => {
    if (recipeForm.ingredients.length > 1) {
      const newIngredients = recipeForm.ingredients.filter((_, i) => i !== index);
      setRecipeForm({ ...recipeForm, ingredients: newIngredients });
    }
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...recipeForm.ingredients];
    newIngredients[index][field] = value;
    setRecipeForm({ ...recipeForm, ingredients: newIngredients });
  };

  const addStep = () => {
    setRecipeForm({
      ...recipeForm,
      steps: [...recipeForm.steps, '']
    });
  };

  const removeStep = (index) => {
    if (recipeForm.steps.length > 1) {
      const newSteps = recipeForm.steps.filter((_, i) => i !== index);
      setRecipeForm({ ...recipeForm, steps: newSteps });
    }
  };

  const updateStep = (index, value) => {
    const newSteps = [...recipeForm.steps];
    newSteps[index] = value;
    setRecipeForm({ ...recipeForm, steps: newSteps });
  };

  const toggleTag = (tag) => {
    const tags = recipeForm.tags.includes(tag)
      ? recipeForm.tags.filter(t => t !== tag)
      : [...recipeForm.tags, tag];
    setRecipeForm({ ...recipeForm, tags });
  };

  const tabs = [
    { id: 'stats', label: '数据统计', icon: '📊' },
    { id: 'users', label: '用户管理', icon: '👥' },
    { id: 'families', label: '家庭管理', icon: '🏠' },
    { id: 'recipes', label: '食谱管理', icon: '📖' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
        <p className="text-gray-500 mt-1">管理系统用户、家庭和食谱数据</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">加载中...</div>
          ) : (
            <>
              {activeTab === 'stats' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-6 bg-blue-50 rounded-xl text-center">
                    <p className="text-4xl font-bold text-blue-600">{stats?.userCount || 0}</p>
                    <p className="text-sm text-gray-500 mt-2">注册用户</p>
                  </div>
                  <div className="p-6 bg-green-50 rounded-xl text-center">
                    <p className="text-4xl font-bold text-green-600">{stats?.familyCount || 0}</p>
                    <p className="text-sm text-gray-500 mt-2">家庭数量</p>
                  </div>
                  <div className="p-6 bg-orange-50 rounded-xl text-center">
                    <p className="text-4xl font-bold text-orange-600">{stats?.recipeCount || 0}</p>
                    <p className="text-sm text-gray-500 mt-2">食谱总数</p>
                  </div>
                  <div className="p-6 bg-purple-50 rounded-xl text-center">
                    <p className="text-4xl font-bold text-purple-600">{stats?.mealCount || 0}</p>
                    <p className="text-sm text-gray-500 mt-2">饮食记录</p>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-3 font-medium text-gray-500">用户名</th>
                        <th className="pb-3 font-medium text-gray-500">角色</th>
                        <th className="pb-3 font-medium text-gray-500">所属家庭</th>
                        <th className="pb-3 font-medium text-gray-500">注册时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b last:border-b-0">
                          <td className="py-3 font-medium">{user.username}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.role === 'admin' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {user.role === 'admin' ? '管理员' : '普通用户'}
                            </span>
                          </td>
                          <td className="py-3 text-gray-600">{user.family_name || '-'}</td>
                          <td className="py-3 text-gray-500 text-sm">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'families' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-3 font-medium text-gray-500">家庭名称</th>
                        <th className="pb-3 font-medium text-gray-500">成员数</th>
                        <th className="pb-3 font-medium text-gray-500">用户数</th>
                        <th className="pb-3 font-medium text-gray-500">创建时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {families.map((family) => (
                        <tr key={family.id} className="border-b last:border-b-0">
                          <td className="py-3 font-medium">{family.name}</td>
                          <td className="py-3">{family.member_count} 人</td>
                          <td className="py-3">{family.user_count} 个</td>
                          <td className="py-3 text-gray-500 text-sm">
                            {new Date(family.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'recipes' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">食谱列表</h3>
                    <button
                      onClick={() => setShowRecipeModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      + 添加食谱
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-4">🍳</span>
                          <div>
                            <h4 className="font-medium">{recipe.name}</h4>
                            <p className="text-sm text-gray-500">
                              ⏱️ {recipe.cook_time}分钟 · {recipe.difficulty}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditRecipe(recipe)}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteRecipe(recipe.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showRecipeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingRecipe ? '编辑食谱' : '添加食谱'}
            </h2>
            <form onSubmit={handleRecipeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    食谱名称 *
                  </label>
                  <input
                    type="text"
                    value={recipeForm.name}
                    onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      烹饪时间(分钟)
                    </label>
                    <input
                      type="number"
                      value={recipeForm.cook_time}
                      onChange={(e) => setRecipeForm({ ...recipeForm, cook_time: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      难度
                    </label>
                    <select
                      value={recipeForm.difficulty}
                      onChange={(e) => setRecipeForm({ ...recipeForm, difficulty: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {difficulties.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={recipeForm.description}
                  onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        recipeForm.tags.includes(tag)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    食材 *
                  </label>
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    + 添加食材
                  </button>
                </div>
                <div className="space-y-2">
                  {recipeForm.ingredients.map((ing, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={ing.name}
                        onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                        placeholder="食材名称"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={ing.amount}
                        onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                        placeholder="数量"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <select
                        value={ing.unit}
                        onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="个">个</option>
                        <option value="片">片</option>
                      </select>
                      {recipeForm.ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="px-2 text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    步骤
                  </label>
                  <button
                    type="button"
                    onClick={addStep}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    + 添加步骤
                  </button>
                </div>
                <div className="space-y-2">
                  {recipeForm.steps.map((step, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => updateStep(index, e.target.value)}
                        placeholder="输入步骤描述"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      {recipeForm.steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="px-2 text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  营养信息（每份）
                </label>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">热量</label>
                    <input
                      type="number"
                      value={recipeForm.nutrition.calories}
                      onChange={(e) => setRecipeForm({
                        ...recipeForm,
                        nutrition: { ...recipeForm.nutrition, calories: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">蛋白质(g)</label>
                    <input
                      type="number"
                      value={recipeForm.nutrition.protein}
                      onChange={(e) => setRecipeForm({
                        ...recipeForm,
                        nutrition: { ...recipeForm.nutrition, protein: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">碳水(g)</label>
                    <input
                      type="number"
                      value={recipeForm.nutrition.carbs}
                      onChange={(e) => setRecipeForm({
                        ...recipeForm,
                        nutrition: { ...recipeForm.nutrition, carbs: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">脂肪(g)</label>
                    <input
                      type="number"
                      value={recipeForm.nutrition.fat}
                      onChange={(e) => setRecipeForm({
                        ...recipeForm,
                        nutrition: { ...recipeForm.nutrition, fat: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">纤维(g)</label>
                    <input
                      type="number"
                      value={recipeForm.nutrition.fiber}
                      onChange={(e) => setRecipeForm({
                        ...recipeForm,
                        nutrition: { ...recipeForm.nutrition, fiber: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeRecipeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingRecipe ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
