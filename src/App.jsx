import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabaseClient.js';

import MainLayout from '@/layouts/MainLayout.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import NotFoundPage from '@/pages/NotFoundPage.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import SettingsPage from '@/pages/SettingsPage.jsx'; 

import LoadOperationPage from '@/pages/LoadOperationPage.jsx';
import TransactionsPage from '@/pages/TransactionsPage.jsx';
import CashPage from '@/pages/CashPage.jsx';
import ExpensesPage from '@/pages/ExpensesPage.jsx';
import SocietyPage from '@/pages/SocietyPage.jsx';
import ClientsPage from '@/pages/ClientsPage.jsx';
import UserManagementPage from '@/pages/UserManagementPage.jsx';
import PendingOperationsPage from '@/pages/PendingOperationsPage.jsx';
import AdminLogPage from '@/pages/AdminLogPage.jsx'; 
import FutureCashPage from '@/pages/FutureCashPage.jsx';

import { AuthProvider, useAuth } from '@/context/AuthContext.jsx';
import { OperationProvider } from '@/context/OperationContext.jsx';
import { useToast } from "@/components/ui/use-toast";
import { debug } from '@/lib/logger.js';

const GlobalLoadingIndicator = () => {
    const { loading: authIsLoading, initialAuthChecked } = useAuth();
    if (authIsLoading || !initialAuthChecked) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 z-[200]">
                <div className="p-4 bg-slate-800/80 rounded-lg shadow-2xl flex flex-col items-center">
                    <svg className="animate-spin h-10 w-10 text-sky-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-300 text-sm">Cargando aplicación...</p>
                </div>
            </div>
        );
    }
    return null;
};

const EmergencyFallback = () => {
  const { initialAuthChecked, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!initialAuthChecked && !loading) {
        toast({
          title: "Problema de Carga",
          description: "La aplicación no pudo iniciar correctamente. Serás redirigido al inicio de sesión.",
          variant: "destructive",
          duration: 7000,
        });
        navigate('/login', { replace: true });
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [initialAuthChecked, loading, navigate, toast]);

  return null;
};

function AppContent() {
  const { currentUser, loading, initialAuthChecked } = useAuth(); 

  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').limit(1);
        if (error) {
          console.error("[AppContent Test Supabase] Error:", error.message);
        } else {
          console.log("[AppContent Test Supabase] Data:", data);
        }
      } catch (err) {
        console.error("[AppContent Test Supabase] Unexpected Error:", err.message);
      }
    };

    if (initialAuthChecked) { 
        testSupabaseConnection();
    }
  }, [initialAuthChecked]);

  if (!initialAuthChecked || loading) {
    return <GlobalLoadingIndicator />; 
  }

  if (!currentUser) {
    return <LoginPage />;
  }
  
  return (
    <>
      <EmergencyFallback />
      <OperationProvider>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<LoadOperationPage />} />
                <Route path="pending-operations" element={<PendingOperationsPage />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="cash" element={<CashPage />} />
                <Route path="future-cash" element={<FutureCashPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="society" element={<SocietyPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="admin/users" element={
                  <ProtectedRoute adminOnly={true}>
                    <UserManagementPage />
                  </ProtectedRoute>
                } />
                <Route path="admin/log" element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminLogPage />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </AnimatePresence>
          <Toaster />
      </OperationProvider>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<GlobalLoadingIndicator />}>
          <AppContent />
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;