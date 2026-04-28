"use client";

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="flex justify-between items-center bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">Welcome, {user?.email}</span>
              <button 
                onClick={logout}
                className="px-4 py-2 bg-red-600/10 text-red-500 hover:bg-red-600/20 border border-red-600/20 rounded-lg transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-md">
              <h3 className="text-xl font-semibold mb-2">Total Users</h3>
              <p className="text-4xl font-bold text-blue-500">1,204</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-md">
              <h3 className="text-xl font-semibold mb-2">Active Sessions</h3>
              <p className="text-4xl font-bold text-green-500">42</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-md">
              <h3 className="text-xl font-semibold mb-2">System Status</h3>
              <p className="text-4xl font-bold text-emerald-400">Healthy</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
