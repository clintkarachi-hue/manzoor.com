/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BranchProvider, useBranch } from './context/BranchContext';
import { SettingsProvider } from './context/SettingsContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Branches } from './pages/Branches';
import { Inventory } from './pages/Inventory';
import { Settings } from './pages/Settings';
import { Sales } from './pages/Sales';
import { Purchases } from './pages/Purchases';
import { Customers } from './pages/Customers';
import { Vendors } from './pages/Vendors';
import { Employees } from './pages/Employees';
import { Payroll } from './pages/Payroll';
import { Ledger } from './pages/Ledger';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, loading: authLoading } = useAuth();
  const { loading: branchLoading } = useBranch();
  
  if (authLoading || branchLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/sales" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BranchProvider>
        <SettingsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                {/* Dashboard not for billing_only */}
                <Route index element={<ProtectedRoute allowedRoles={['super_admin', 'branch_admin', 'staff']}><Dashboard /></ProtectedRoute>} />
                
                <Route path="inventory" element={<ProtectedRoute allowedRoles={['super_admin', 'branch_admin', 'staff']}><Inventory /></ProtectedRoute>} />
                
                {/* Sales is allowed for billing_only */}
                <Route path="sales" element={<Sales />} />
                
                <Route path="purchases" element={<ProtectedRoute allowedRoles={['super_admin', 'branch_admin', 'staff']}><Purchases /></ProtectedRoute>} />
                <Route path="customers" element={<ProtectedRoute allowedRoles={['super_admin', 'branch_admin', 'staff', 'billing_only']}><Customers /></ProtectedRoute>} />
                <Route path="vendors" element={<ProtectedRoute allowedRoles={['super_admin', 'branch_admin', 'staff']}><Vendors /></ProtectedRoute>} />
                
                {/* Higher level management */}
                <Route path="employees" element={<ProtectedRoute allowedRoles={['super_admin', 'branch_admin']}><Employees /></ProtectedRoute>} />
                <Route path="payroll" element={<ProtectedRoute allowedRoles={['super_admin', 'branch_admin']}><Payroll /></ProtectedRoute>} />
                <Route path="ledger" element={<ProtectedRoute allowedRoles={['super_admin', 'branch_admin']}><Ledger /></ProtectedRoute>} />
                <Route path="reports" element={<ProtectedRoute allowedRoles={['super_admin', 'branch_admin']}><Reports /></ProtectedRoute>} />
                
                {/* Users/Logins Management */}
                <Route path="users" element={<ProtectedRoute allowedRoles={['super_admin', 'branch_admin']}><Users /></ProtectedRoute>} />

                {/* Super Admin Only */}
                <Route path="branches" element={<ProtectedRoute allowedRoles={['super_admin']}><Branches /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute allowedRoles={['super_admin']}><Settings /></ProtectedRoute>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SettingsProvider>
      </BranchProvider>
    </AuthProvider>
  );
}
