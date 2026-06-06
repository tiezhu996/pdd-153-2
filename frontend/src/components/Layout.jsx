import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: '首页', icon: '🏠' },
    { path: '/members', label: '家庭成员', icon: '👨‍👩‍👧‍👦' },
    { path: '/recipes', label: '食谱库', icon: '📖' },
    { path: '/meals', label: '饮食记录', icon: '🍽️' },
    { path: '/shopping', label: '购物清单', icon: '🛒' },
    { path: '/report', label: '健康周报', icon: '📊' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: '管理后台', icon: '⚙️' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-green-600">🥗 家庭饮食健康管理</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">欢迎，{user?.username}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          <aside className="w-56 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                        location.pathname === item.path
                          ? 'bg-green-100 text-green-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default Layout;
