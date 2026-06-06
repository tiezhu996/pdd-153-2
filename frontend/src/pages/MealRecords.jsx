import { useState, useEffect } from 'react';
import axios from 'axios';

function MealRecords() {
  const [meals, setMeals] = useState([]);
  const [members, setMembers] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    meal_type: '午餐',
    recipe_id: '',
    recipe_name: '',
    servings: 1,
    member_ids: [],
    ingredients: []
  });

  const mealTypes = ['早餐', '午餐', '晚餐', '加餐'];

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const [mealsRes, membersRes, recipesRes] = await Promise.all([
        axios.get(`/api/meals?date=${selectedDate}`),
        axios.get('/api/members'),
        axios.get('/api/recipes')
      ]);
      setMeals(mealsRes.data);
      setMembers(membersRes.data);
      setRecipes(recipesRes.data);
    } catch (err) {
      console.error('获取数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeSelect = (recipeId) => {
    const recipe = recipes.find(r => r.id == recipeId);
    if (recipe) {
      setFormData({
        ...formData,
        recipe_id: recipe.id,
        recipe_name: recipe.name,
        ingredients: recipe.ingredients || []
      });
    }
  };

  const handleMemberToggle = (memberId) => {
    const memberIds = formData.member_ids.includes(memberId)
      ? formData.member_ids.filter(id => id !== memberId)
      : [...formData.member_ids, memberId];
    setFormData({ ...formData, member_ids: memberIds });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.recipe_name) {
      alert('请选择或输入菜品名称');
      return;
    }
    if (formData.member_ids.length === 0) {
      alert('请选择用餐成员');
      return;
    }

    try {
      await axios.post('/api/meals', formData);
      fetchData();
      closeModal();
    } catch (err) {
      alert(err.response?.data?.error || '记录失败');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除这条记录吗？')) {
      try {
        await axios.delete(`/api/meals/${id}`);
        fetchData();
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      date: selectedDate,
      meal_type: '午餐',
      recipe_id: '',
      recipe_name: '',
      servings: 1,
      member_ids: [],
      ingredients: []
    });
  };

  const getMealsByType = (type) => meals.filter(m => m.meal_type === type);

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">饮食记录</h1>
          <p className="text-gray-500 mt-1">记录每日饮食，自动统计营养摄入</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          + 添加记录
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <label className="font-medium text-gray-700">选择日期:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-4">
        {mealTypes.map((type) => (
          <div key={type} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2">
                  {type === '早餐' ? '🌅' : type === '午餐' ? '☀️' : type === '晚餐' ? '🌙' : '🍪'}
                </span>
                {type}
                <span className="ml-2 text-sm text-gray-500 font-normal">
                  ({getMealsByType(type).length} 道菜)
                </span>
              </h2>
            </div>
            <div className="p-6">
              {getMealsByType(type).length > 0 ? (
                <div className="space-y-3">
                  {getMealsByType(type).map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-4">🍽️</span>
                        <div>
                          <h3 className="font-medium text-gray-900">{meal.recipe_name}</h3>
                          <p className="text-sm text-gray-500">
                            {meal.servings}人份 · 用餐: {meal.member_ids?.map(id => {
                              const member = members.find(m => m.id === id);
                              return member?.name;
                            }).filter(Boolean).join('、') || '未指定'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(meal.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  暂无{type}记录
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {members.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">📊 今日营养摄入统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => {
              const memberMeals = meals.filter(m => m.member_ids?.includes(member.id));
              const totalNutrition = memberMeals.reduce((acc, meal) => {
                const recipe = recipes.find(r => r.id === meal.recipe_id);
                if (recipe?.nutrition) {
                  const ratio = 1 / (meal.member_ids?.length || 1);
                  acc.calories += (recipe.nutrition.calories || 0) * (meal.servings || 1) * ratio;
                  acc.protein += (recipe.nutrition.protein || 0) * (meal.servings || 1) * ratio;
                  acc.carbs += (recipe.nutrition.carbs || 0) * (meal.servings || 1) * ratio;
                  acc.fat += (recipe.nutrition.fat || 0) * (meal.servings || 1) * ratio;
                }
                return acc;
              }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

              return (
                <div key={member.id} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">{member.name}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">热量:</span>
                      <span className="ml-1 font-medium">{Math.round(totalNutrition.calories)} kcal</span>
                    </div>
                    <div>
                      <span className="text-gray-500">蛋白质:</span>
                      <span className="ml-1 font-medium">{totalNutrition.protein.toFixed(1)}g</span>
                    </div>
                    <div>
                      <span className="text-gray-500">碳水:</span>
                      <span className="ml-1 font-medium">{totalNutrition.carbs.toFixed(1)}g</span>
                    </div>
                    <div>
                      <span className="text-gray-500">脂肪:</span>
                      <span className="ml-1 font-medium">{totalNutrition.fat.toFixed(1)}g</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">添加饮食记录</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">餐次</label>
                <select
                  value={formData.meal_type}
                  onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {mealTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择食谱</label>
                <select
                  value={formData.recipe_id}
                  onChange={(e) => handleRecipeSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">-- 选择食谱（可选）--</option>
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">菜品名称 *</label>
                <input
                  type="text"
                  value={formData.recipe_name}
                  onChange={(e) => setFormData({ ...formData, recipe_name: e.target.value })}
                  placeholder="输入菜品名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">份数</label>
                <input
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">用餐成员 *</label>
                <div className="space-y-2">
                  {members.map((member) => (
                    <label key={member.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.member_ids.includes(member.id)}
                        onChange={() => handleMemberToggle(member.id)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="ml-2 text-gray-700">{member.name}</span>
                      {member.allergens?.length > 0 && (
                        <span className="ml-2 text-xs text-red-500">
                          (过敏源: {member.allergens.join(', ')})
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {members.length === 0 && (
                  <p className="text-sm text-gray-500">请先在"家庭成员"页面添加成员</p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MealRecords;
