import { useState, useEffect } from 'react';
import axios from 'axios';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

function WeeklyReport() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(getWeekStart());

  function getWeekStart() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchReportData();
  }, [weekStart]);

  const fetchReportData = async () => {
    try {
      const response = await axios.get(`/api/reports/weekly?weekStart=${weekStart}`);
      setReportData(response.data);
    } catch (err) {
      console.error('获取周报失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const changeWeek = (direction) => {
    const current = new Date(weekStart);
    current.setDate(current.getDate() + direction * 7);
    setWeekStart(current.toISOString().split('T')[0]);
  };

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const mealTypes = { '早餐': '🌅', '午餐': '☀️', '晚餐': '🌙', '加餐': '🍪' };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">健康周报</h1>
          <p className="text-gray-500 mt-1">总结全家人饮食情况，获取改善建议</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => changeWeek(-1)}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← 上一周
          </button>
          <span className="text-gray-600">
            {reportData?.weekStart} ~ {reportData?.weekEnd}
          </span>
          <button
            onClick={() => changeWeek(1)}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            下一周 →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">本周记录餐次</p>
              <p className="text-3xl font-bold text-gray-900">{reportData?.totalMeals || 0}</p>
            </div>
            <div className="text-4xl">🍽️</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">有记录天数</p>
              <p className="text-3xl font-bold text-gray-900">
                {Object.keys(reportData?.mealsByDay || {}).length}
              </p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">家庭成员</p>
              <p className="text-3xl font-bold text-gray-900">
                {Object.keys(reportData?.memberNutrition || {}).length}
              </p>
            </div>
            <div className="text-4xl">👨‍👩‍👧‍👦</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">改善建议</p>
              <p className="text-3xl font-bold text-orange-500">
                {reportData?.suggestions?.length || 0}
              </p>
            </div>
            <div className="text-4xl">💡</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📅 本周饮食记录</h2>
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + index);
            const dateStr = date.toISOString().split('T')[0];
            const dayMeals = reportData?.mealsByDay?.[dateStr] || [];

            return (
              <div key={day} className="border border-gray-200 rounded-lg p-3">
                <h3 className="font-medium text-gray-900 text-center mb-2">{day}</h3>
                <p className="text-xs text-gray-400 text-center mb-3">{dateStr.slice(5)}</p>
                {dayMeals.length > 0 ? (
                  <div className="space-y-2">
                    {dayMeals.map((meal, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-gray-50 rounded text-xs"
                        title={meal.recipe_name}
                      >
                        <span className="mr-1">{mealTypes[meal.meal_type]}</span>
                        <span className="text-gray-700 truncate block">
                          {meal.recipe_name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-300 text-xs py-4">
                    暂无记录
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 家庭成员营养摄入</h2>
          <div className="space-y-4">
            {Object.entries(reportData?.memberNutrition || {}).map(([id, member]) => (
              <div key={id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-gray-900">{member.name}</span>
                  <span className="text-sm text-gray-500">{member.meals} 餐</span>
                </div>
                <div className="grid grid-cols-5 gap-2 text-xs text-center">
                  <div>
                    <p className="text-gray-500">热量</p>
                    <p className="font-medium">{Math.round(member.calories)}</p>
                    <p className="text-gray-400">kcal</p>
                  </div>
                  <div>
                    <p className="text-gray-500">蛋白质</p>
                    <p className="font-medium">{member.protein.toFixed(1)}</p>
                    <p className="text-gray-400">g</p>
                  </div>
                  <div>
                    <p className="text-gray-500">碳水</p>
                    <p className="font-medium">{member.carbs.toFixed(1)}</p>
                    <p className="text-gray-400">g</p>
                  </div>
                  <div>
                    <p className="text-gray-500">脂肪</p>
                    <p className="font-medium">{member.fat.toFixed(1)}</p>
                    <p className="text-gray-400">g</p>
                  </div>
                  <div>
                    <p className="text-gray-500">纤维</p>
                    <p className="font-medium">{member.fiber.toFixed(1)}</p>
                    <p className="text-gray-400">g</p>
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(reportData?.memberNutrition || {}).length === 0 && (
              <div className="text-center text-gray-400 py-8">暂无数据</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💡 营养雷达图</h2>
          <div className="h-64">
            {Object.values(reportData?.memberNutrition || {}).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={Object.values(reportData?.memberNutrition || {})}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                  <Radar name="热量" dataKey={(d) => d.calories / 100} stroke="#F97316" fill="#F97316" fillOpacity={0.3} />
                  <Radar name="蛋白质" dataKey={(d) => d.protein * 5} stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                  <Radar name="纤维" dataKey={(d) => d.fiber * 10} stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                暂无数据
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 改善建议</h2>
        {reportData?.suggestions?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportData.suggestions.map((item, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                  <span className="text-xl mr-2">👤</span>
                  {item.member}
                </h3>
                <ul className="space-y-2">
                  {item.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-600">
                      <span className="text-green-500 mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            🎉 太棒了！本周没有特别的改善建议，继续保持健康的饮食习惯！
          </div>
        )}
      </div>
    </div>
  );
}

export default WeeklyReport;
