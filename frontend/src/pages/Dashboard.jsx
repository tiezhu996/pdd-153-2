import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/reports/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      console.error('获取数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  const chartData = Object.entries(dashboardData?.dailyStats || {}).map(([date, data]) => ({
    date: date.slice(5),
    meals: data.meals,
    calories: Math.round(data.calories)
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">本周饮食概况</h1>
        <p className="text-gray-500 mt-1">
          {dashboardData?.weekStart} 至 {dashboardData?.weekEnd}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">家庭成员</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData?.memberCount || 0}</p>
            </div>
            <div className="text-4xl">👨‍👩‍👧‍👦</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">本周记录餐次</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData?.totalMeals || 0}</p>
            </div>
            <div className="text-4xl">🍽️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总热量摄入</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(
                  Object.values(dashboardData?.memberNutrition || {}).reduce((sum, m) => sum + m.calories, 0)
                )}
                <span className="text-lg font-normal"> kcal</span>
              </p>
            </div>
            <div className="text-4xl">🔥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">营养素提醒</p>
              <p className="text-3xl font-bold text-orange-500">
                {dashboardData?.nutrientAlerts?.length || 0}
              </p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">每日饮食统计</h2>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="meals" name="餐次" fill="#10B981" />
                  <Bar dataKey="calories" name="热量" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                暂无数据
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">家庭成员营养摄入</h2>
          <div className="space-y-4">
            {Object.entries(dashboardData?.memberNutrition || {}).map(([id, member]) => (
              <div key={id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{member.name}</span>
                  <span className="text-sm text-gray-500">{member.meals} 餐</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">热量</p>
                    <p className="font-medium">{Math.round(member.calories)} kcal</p>
                  </div>
                  <div>
                    <p className="text-gray-500">蛋白质</p>
                    <p className="font-medium">{member.protein.toFixed(1)}g</p>
                  </div>
                  <div>
                    <p className="text-gray-500">碳水</p>
                    <p className="font-medium">{member.carbs.toFixed(1)}g</p>
                  </div>
                  <div>
                    <p className="text-gray-500">脂肪</p>
                    <p className="font-medium">{member.fat.toFixed(1)}g</p>
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(dashboardData?.memberNutrition || {}).length === 0 && (
              <div className="text-center text-gray-400 py-4">暂无数据</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">⚠️ 待补充营养素提醒</h2>
        {dashboardData?.nutrientAlerts?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.nutrientAlerts.map((alert, index) => (
              <div key={index} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start">
                  <span className="text-xl mr-3">
                    {alert.type === 'protein' ? '🥩' : alert.type === 'fiber' ? '🥬' : '⚡'}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{alert.member}</p>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      当前: {alert.current} / 建议: {alert.expected}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            🎉 太棒了！本周没有营养素提醒，继续保持！
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
