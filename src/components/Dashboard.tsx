import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Users, Shield, Building2, LogOut, Menu, X, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function Dashboard({ setToken }: { setToken: (token: string | null) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  // Expand settings menu if current path includes settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(location.pathname.includes('/settings'));

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: '智能问答', path: '/chat', icon: MessageSquare },
  ];

  const settingsItems = [
    { name: '组织架构', path: '/settings/orgs', icon: Building2 },
    { name: '角色管理', path: '/settings/roles', icon: Shield },
    { name: '账号管理', path: '/settings/accounts', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile Menu Button */}
      <button 
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-md shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <h1 className="text-base font-bold text-slate-800">山西校园健康数问平台</h1>
          </div>
          
          <div className="p-4 flex items-center space-x-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {user?.name?.[0] || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{user?.name || '用户'}</p>
              <p className="text-xs text-slate-500">{user?.role?.name || '管理员'}</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto w-full">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}

            <div className="mt-2">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <div className="flex items-center space-x-3">
                  <Settings size={18} className="text-slate-400" />
                  <span>系统设置</span>
                </div>
                {isSettingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {isSettingsOpen && (
                <div className="mt-1 space-y-1 pl-4">
                  {settingsItems.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) => `
                        flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
                        ${isActive 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                          <span>{item.name}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut size={18} />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
