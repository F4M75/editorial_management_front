import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/common/Layout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ArticlesPage from '@/pages/ArticlesPage';
import ArticleFormPage from '@/pages/ArticleFormPage';
import CategoriesPage from '@/pages/CategoriesPage';
import NotificationsPage from '@/pages/NotificationsPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/articles/new" element={<ArticleFormPage />} />
            <Route path="/articles/:id/edit" element={<ArticleFormPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
};

export default App;
