import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login.tsx';
import Dashboard from './components/Dashboard.tsx';
import ChatBot from './components/ChatBot.tsx';
import OrgManagement from './components/OrgManagement.tsx';
import RoleManagement from './components/RoleManagement.tsx';
import AccountManagement from './components/AccountManagement.tsx';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" /> : <Login setToken={setToken} />} />
        
        <Route path="/" element={token ? <Dashboard setToken={setToken} /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/chat" />} />
          <Route path="chat" element={<ChatBot />} />
          <Route path="settings/orgs" element={<OrgManagement />} />
          <Route path="settings/roles" element={<RoleManagement />} />
          <Route path="settings/accounts" element={<AccountManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}
