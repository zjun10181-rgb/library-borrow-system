import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from '@/store/authStore';
import { RequireAuth, RequireAdmin } from '@/components/layout/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { Home } from '@/pages/Home';
import { Library } from '@/pages/Library';
import { BookDetail } from '@/pages/BookDetail';
import { BookAdd } from '@/pages/BookAdd';
import { BookEdit } from '@/pages/BookEdit';
import { BorrowForm } from '@/pages/BorrowForm';
import { ReturnForm } from '@/pages/ReturnForm';
import { MyBorrowing } from '@/pages/MyBorrowing';
import { AdminPanel } from '@/pages/AdminPanel';
import { FamilyLibrary } from '@/pages/FamilyLibrary';

export default function App() {
  const { initialize } = useAuthStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  return (
    <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <RequireAuth>
              <Layout>
                <Home />
              </Layout>
            </RequireAuth>
          } />
          
          <Route path="/dashboard" element={
            <RequireAuth>
              <Layout>
                <Dashboard />
              </Layout>
            </RequireAuth>
          } />
          
          <Route path="/library" element={
            <RequireAuth>
              <Layout>
                <Library />
              </Layout>
            </RequireAuth>
          } />
          
          <Route path="/library/book/:id" element={
            <RequireAuth>
              <Layout>
                <BookDetail />
              </Layout>
            </RequireAuth>
          } />
          
          <Route path="/library/add" element={
            <RequireAuth>
              <Layout>
                <BookAdd />
              </Layout>
            </RequireAuth>
          } />
          
          <Route path="/library/edit/:id" element={
            <RequireAuth>
              <Layout>
                <BookEdit />
              </Layout>
            </RequireAuth>
          } />
          
          <Route path="/library/borrow" element={
            <RequireAuth>
              <Layout>
                <BorrowForm />
              </Layout>
            </RequireAuth>
          } />
          
          <Route path="/library/return" element={
            <RequireAuth>
              <Layout>
                <ReturnForm />
              </Layout>
            </RequireAuth>
          } />
          
          <Route path="/my-borrowing" element={
            <RequireAuth>
              <Layout>
                <MyBorrowing />
              </Layout>
            </RequireAuth>
          } />
          
          <Route path="/family-library" element={
            <RequireAuth>
              <Layout>
                <FamilyLibrary />
              </Layout>
            </RequireAuth>
          } />
          
          <Route path="/admin" element={
            <RequireAdmin>
              <Layout>
                <AdminPanel />
              </Layout>
            </RequireAdmin>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
  );
}