import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from '@/store/authStore';
import { RequireAuth, RequireAdmin } from '@/components/layout/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';

const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('@/pages/Register').then(m => ({ default: m.Register })));
const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.Home })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Library = lazy(() => import('@/pages/Library').then(m => ({ default: m.Library })));
const BookDetail = lazy(() => import('@/pages/BookDetail').then(m => ({ default: m.BookDetail })));
const BookAdd = lazy(() => import('@/pages/BookAdd').then(m => ({ default: m.BookAdd })));
const BookEdit = lazy(() => import('@/pages/BookEdit').then(m => ({ default: m.BookEdit })));
const BorrowForm = lazy(() => import('@/pages/BorrowForm').then(m => ({ default: m.BorrowForm })));
const ReturnForm = lazy(() => import('@/pages/ReturnForm').then(m => ({ default: m.ReturnForm })));
const MyBorrowing = lazy(() => import('@/pages/MyBorrowing').then(m => ({ default: m.MyBorrowing })));
const AdminPanel = lazy(() => import('@/pages/AdminPanel').then(m => ({ default: m.AdminPanel })));
const FamilyLibrary = lazy(() => import('@/pages/FamilyLibrary').then(m => ({ default: m.FamilyLibrary })));

function PageLoader() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <Layout>{children}</Layout>
    </RequireAuth>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <Layout>{children}</Layout>
    </RequireAdmin>
  );
}

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router basename="/library">
        <Routes>
          <Route path="/login" element={<Suspense><Login /></Suspense>} />
          <Route path="/register" element={<Suspense><Register /></Suspense>} />

          <Route path="/" element={<AuthLayout><Suspense fallback={<PageLoader />}><Home /></Suspense></AuthLayout>} />
          <Route path="/dashboard" element={<AuthLayout><Suspense fallback={<PageLoader />}><Dashboard /></Suspense></AuthLayout>} />
          <Route path="/library" element={<AuthLayout><Suspense fallback={<PageLoader />}><Library /></Suspense></AuthLayout>} />
          <Route path="/library/book/:id" element={<AuthLayout><Suspense fallback={<PageLoader />}><BookDetail /></Suspense></AuthLayout>} />
          <Route path="/library/add" element={<AuthLayout><Suspense fallback={<PageLoader />}><BookAdd /></Suspense></AuthLayout>} />
          <Route path="/library/edit/:id" element={<AuthLayout><Suspense fallback={<PageLoader />}><BookEdit /></Suspense></AuthLayout>} />
          <Route path="/library/borrow" element={<AuthLayout><Suspense fallback={<PageLoader />}><BorrowForm /></Suspense></AuthLayout>} />
          <Route path="/library/return" element={<AuthLayout><Suspense fallback={<PageLoader />}><ReturnForm /></Suspense></AuthLayout>} />
          <Route path="/my-borrowing" element={<AuthLayout><Suspense fallback={<PageLoader />}><MyBorrowing /></Suspense></AuthLayout>} />
          <Route path="/family-library" element={<AuthLayout><Suspense fallback={<PageLoader />}><FamilyLibrary /></Suspense></AuthLayout>} />
          <Route path="/admin" element={<AdminLayout><Suspense fallback={<PageLoader />}><AdminPanel /></Suspense></AdminLayout>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
  );
}