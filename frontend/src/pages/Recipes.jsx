import { useState, useEffect } from 'react';
import axios from 'axios';

function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAllergens, setFilterAllergens] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedTag, setSelectedTag] = useState('');

  const allTags = ['家常菜', '快手菜', '素菜', '荤菜', '低脂', '高蛋白', '高纤维', '早餐'];

  useEffect(() => {
    fetchRecipes();
  }, [searchTerm, selectedTag, filterAllergens]);

  const fetchRecipes = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedTag) params.append('tag', selectedTag);
      if (filterAllergens) params.append('filterAllergens', 'true');

      const response = await axios.get(`/api/recipes?${params.toString()}`);
      setRecipes(response.data);
    } catch (err) {
      console.error('获取食谱失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">食谱库</h1>
        <p className="text-gray-500 mt-1">搜索食谱，系统自动过滤含过敏源的菜品</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索食谱名称或食材..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filterAllergens}
              onChange={(e) => setFilterAllergens(e.target.checked)}
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <span className="text-gray-700">过滤过敏食材</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag('')}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedTag === ''
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedTag === tag
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedRecipe(recipe)}
          >
            <div className="h-40 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
              <span className="text-6xl">🍳</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {recipe.description}
              </p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex flex-wrap gap-1">
                  {recipe.tags?.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-400">
                  ⏱️ {recipe.cook_time}分钟
                </span>
              </div>
            </div>
          </div>
        ))}

        {recipes.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🔍</p>
            <p>没有找到符合条件的食谱</p>
          </div>
        )}
      </div>

      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="h-48 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center relative">
              <span className="text-8xl">🍳</span>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedRecipe.name}</h2>
              <p className="text-gray-500 mt-1">{selectedRecipe.description}</p>

              <div className="flex items-center gap-4 mt-4">
                <span className="text-sm text-gray-500">⏱️ {selectedRecipe.cook_time}分钟</span>
                <span className="text-sm text-gray-500">📊 {selectedRecipe.difficulty}</span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {selectedRecipe.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">📝 食材</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedRecipe.ingredients?.map((ing, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <span className="text-gray-700">{ing.name}</span>
                      <span className="text-sm text-gray-500">
                        {ing.amount} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRecipe.steps?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">👨‍🍳 步骤</h3>
                  <ol className="space-y-3">
                    {selectedRecipe.steps.map((step, index) => (
                      <li key={index} className="flex">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {selectedRecipe.nutrition && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">💪 营养信息（每份）</h3>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-xl font-bold text-orange-600">
                        {selectedRecipe.nutrition.calories}
                      </p>
                      <p className="text-xs text-gray-500">卡路里</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-xl font-bold text-red-600">
                        {selectedRecipe.nutrition.protein}g
                      </p>
                      <p className="text-xs text-gray-500">蛋白质</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-xl font-bold text-yellow-600">
                        {selectedRecipe.nutrition.carbs}g
                      </p>
                      <p className="text-xs text-gray-500">碳水</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xl font-bold text-blue-600">
                        {selectedRecipe.nutrition.fat}g
                      </p>
                      <p className="text-xs text-gray-500">脂肪</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xl font-bold text-green-600">
                        {selectedRecipe.nutrition.fiber}g
                      </p>
                      <p className="text-xs text-gray-500">纤维</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Recipes;
