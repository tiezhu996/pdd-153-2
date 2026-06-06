import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Recipes from './pages/Recipes';
import MealRecords from './pages/MealRecords';
import ShoppingList from './pages/ShoppingList';
import WeeklyReport from './pages/WeeklyReport';
import Admin from './pages/Admin';

function PrivateRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  
  if (!user) return <Navigate to="/login" />;
  
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" />;
  
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="recipes" element={<Recipes />} />
        <Route path="meals" element={<MealRecords />} />
        <Route path="shopping" element={<ShoppingList />} />
        <Route path="report" element={<WeeklyReport />} />
        <Route path="admin" element={
          <PrivateRoute requireAdmin>
            <Admin />
          </PrivateRoute>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
