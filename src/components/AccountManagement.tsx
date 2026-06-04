import { useState, useEffect } from 'react';
import { Plus, Search, UserCircle } from 'lucide-react';
import type { Account, Organization, Role } from '../types';

export default function AccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountForm, setAccountForm] = useState({ name: '', phone: '', roleId: '', orgId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [accountsData, orgsData, rolesData] = await Promise.all([
      fetch('/api/accounts').then(res => res.json()),
      fetch('/api/organizations').then(res => res.json()),
      fetch('/api/roles').then(res => res.json())
    ]);
    setAccounts(accountsData);
    setOrgs(orgsData);
    setRoles(rolesData);
    setLoading(false);
  };

  const openModal = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setAccountForm({ name: account.name, phone: account.phone, roleId: account.roleId, orgId: account.orgId });
    } else {
      setEditingAccount(null);
      setAccountForm({ name: '', phone: '', roleId: roles[0]?.id || '', orgId: orgs[0]?.id || '' });
    }
    setIsModalOpen(true);
  };

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      await fetch(`/api/accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm)
      });
    } else {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm)
      });
    }
    setIsModalOpen(false);
    fetchData();
  };

  const deleteAccount = async (id: string) => {
    if (!confirm("确定删除该账号吗？")) return;
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const resetPassword = async (id: string) => {
    if (!confirm("确定要重置该账号的密码为随机默认密码吗？")) return;
    const res = await fetch(`/api/accounts/${id}/reset`, { method: 'POST' });
    const data = await res.json();
    alert(data.message || "密码重置成功");
  };

  const renderOrgOptions = (parentId: string | null = null, depth: number = 0): React.ReactNode[] => {
    return orgs
      .filter(o => o.parentId === parentId)
      .flatMap(org => [
        <option key={org.id} value={org.id}>
          {'\u00A0'.repeat(depth * 4)}{depth > 0 ? '├─ ' : ''}{org.name}
        </option>,
        ...renderOrgOptions(org.id, depth + 1)
      ]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">账号管理</h1>
          <p className="text-slate-500 mt-1 text-sm">创建并管理系统登录账号及其所属机构与角色</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-sm">
          <Plus size={18} />
          新建账号
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
         <div className="p-4 border-b border-slate-100 bg-slate-50 relative">
           <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="搜索姓名或手机号..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4">姓名</th>
                <th className="px-6 py-4">手机号 (登录名)</th>
                <th className="px-6 py-4">角色</th>
                <th className="px-6 py-4">所属机构</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <div className="animate-pulse flex items-center justify-center gap-2">
                      <UserCircle className="text-slate-300" size={20} />
                      正在加载账号数据...
                    </div>
                  </td>
                </tr>
              ) : accounts.map(account => {
                const role = roles.find(r => r.id === account.roleId);
                const org = orgs.find(o => o.id === account.orgId);
                return (
                  <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                          {account.name[0]}
                        </div>
                        <span className="font-medium text-slate-800">{account.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono text-sm">
                      {account.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                        {role ? role.name : '未知角色'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {org ? org.name : '未分配'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button onClick={() => openModal(account)} className="text-blue-600 hover:text-blue-800">编辑</button>
                      <button onClick={() => resetPassword(account.id)} className="text-slate-400 hover:text-slate-600">重置密码</button>
                      <button onClick={() => deleteAccount(account.id)} className="text-red-500 hover:text-red-700">删除</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100">
               <h2 className="text-lg font-bold text-slate-800">{editingAccount ? '编辑账号' : '新建账号'}</h2>
             </div>
             <form onSubmit={saveAccount} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
                  <input required value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">手机号 (登录名)</label>
                  <input required value={accountForm.phone} onChange={e => setAccountForm({...accountForm, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">角色</label>
                  <select required value={accountForm.roleId} onChange={e => setAccountForm({...accountForm, roleId: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">选择角色</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">所属机构</label>
                  <select required value={accountForm.orgId} onChange={e => setAccountForm({...accountForm, orgId: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm">
                    <option value="">选择机构</option>
                    {renderOrgOptions()}
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">取消</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">保存</button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
