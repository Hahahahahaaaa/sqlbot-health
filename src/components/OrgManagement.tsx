import { useState, useEffect } from 'react';
import { Plus, Search, Building, ChevronRight, ChevronDown, RefreshCw, Edit2, Trash2, UserCircle } from 'lucide-react';
import type { Organization, Account, Role } from '../types';

export default function OrgManagement() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());

  // Modal states
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [orgForm, setOrgForm] = useState({ name: '', level: 1, parentId: '', dataSources: [] as string[] });
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [sourceSearch, setSourceSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [orgsRes, accsRes, rolesRes, dsRes] = await Promise.all([
      fetch('/api/organizations'),
      fetch('/api/accounts'),
      fetch('/api/roles'),
      fetch('/api/datasources')
    ]);
    const [orgsData, accsData, rolesData, dsData] = await Promise.all([orgsRes.json(), accsRes.json(), rolesRes.json(), dsRes.json()]);
    setOrgs(orgsData);
    setAccounts(accsData);
    setRoles(rolesData);
    setAvailableSources(dsData);
    if (orgsData.length > 0 && !selectedOrgId) {
      setSelectedOrgId(orgsData[0].id);
    }
    setExpandedOrgs(new Set(orgsData.map((o: any) => o.id)));
    setLoading(false);
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedOrgs(newExpanded);
  };

  const handleSync = async () => {
    try {
      await fetch('/api/organizations/sync', { method: 'POST' });
      alert("数据源同步成功");
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOrg = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确定移除该机构吗？")) return;
    await fetch(`/api/organizations/${id}`, { method: 'DELETE' });
    if (selectedOrgId === id) setSelectedOrgId(null);
    fetchData();
  };

  const openOrgModal = (org?: Organization) => {
    if (org) {
      setEditingOrg(org);
      setOrgForm({ name: org.name, level: org.level, parentId: org.parentId || '', dataSources: org.dataSources || [] });
    } else {
      setEditingOrg(null);
      setOrgForm({ name: '', level: 1, parentId: selectedOrgId || '', dataSources: [] });
    }
    setSourceSearch('');
    setIsOrgModalOpen(true);
  };

  const saveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: orgForm.name,
      level: Number(orgForm.level),
      parentId: orgForm.parentId || null,
      dataSources: orgForm.dataSources
    };
    if (editingOrg) {
      await fetch(`/api/organizations/${editingOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    setIsOrgModalOpen(false);
    fetchData();
  };

  const renderTree = (parentId: string | null) => {
    const children = orgs.filter(o => o.parentId === parentId);
    if (!children.length) return null;

    return (
      <ul className="pl-4 space-y-1">
        {children.map(org => {
          const isExpanded = expandedOrgs.has(org.id);
          const isSelected = selectedOrgId === org.id;
          const hasChildren = orgs.some(o => o.parentId === org.id);

          return (
            <li key={org.id} className="mt-1">
              <div 
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors group ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100 text-slate-700'}`}
                onClick={() => setSelectedOrgId(org.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0" onClick={(e) => hasChildren && toggleExpand(org.id, e)}>
                    {hasChildren ? (isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />) : <span className="w-4" />}
                  </div>
                  <Building size={16} className={isSelected ? 'text-blue-500' : 'text-slate-400'} />
                  <span className="truncate text-sm font-medium">{org.name}</span>
                </div>
                <div className="hidden group-hover:flex items-center gap-2">
                  <Edit2 size={14} className="text-slate-400 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); openOrgModal(org); }} />
                  <Trash2 size={14} className="text-slate-400 hover:text-red-600" onClick={(e) => handleDeleteOrg(org.id, e)} />
                </div>
              </div>
              {isExpanded && renderTree(org.id)}
            </li>
          );
        })}
      </ul>
    );
  };

  const currentAccounts = accounts.filter(a => a.orgId === selectedOrgId);

  return (
    <div className="h-full flex flex-col p-6 max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">组织架构管理</h1>
          <p className="text-slate-500 mt-1 text-sm">管理机构层级及数据源，查看架构下属账号</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSync} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-sm">
            <RefreshCw size={16} />
            同步数据源
          </button>
          <button onClick={() => openOrgModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-sm">
            <Plus size={16} />
            新建机构
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Left Tree */}
        <div className="w-80 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800">机构树</h3>
          </div>
          <div className="p-2 overflow-y-auto flex-1">
             {loading ? (
               <div className="p-4 text-center text-sm text-slate-500">加载中...</div>
             ) : (
               <div className="-ml-4">{renderTree(null)}</div>
             )}
          </div>
        </div>

        {/* Right Accounts */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col min-w-0">
           <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">机构账号信息</h3>
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-md">{currentAccounts.length} 个账号</span>
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0">
                  <th className="px-6 py-4">姓名</th>
                  <th className="px-6 py-4">手机号</th>
                  <th className="px-6 py-4">角色</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentAccounts.length === 0 ? (
                   <tr>
                     <td colSpan={3} className="px-6 py-12 text-center text-slate-500 text-sm">
                       该机构下暂无账号，请在账号管理中添加。
                     </td>
                   </tr>
                ) : currentAccounts.map(account => {
                  const role = roles.find(r => r.id === account.roleId);
                  return (
                    <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                        <UserCircle size={18} className="text-slate-400" />
                        {account.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-sm">{account.phone}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-1 bg-slate-100 text-xs text-slate-600 rounded">
                          {role?.name || '未知'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Org Modal */}
      {isOrgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100">
               <h2 className="text-lg font-bold text-slate-800">{editingOrg ? '编辑机构' : '新建机构'}</h2>
             </div>
             <form onSubmit={saveOrg} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">机构名称</label>
                  <input required value={orgForm.name} onChange={e => setOrgForm({...orgForm, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">层级</label>
                  <select value={orgForm.level} onChange={e => setOrgForm({...orgForm, level: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value={1}>一级机构</option>
                    <option value={2}>二级机构</option>
                    <option value={3}>三级机构</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">上级机构</label>
                  <select disabled={orgForm.level === 1} value={orgForm.parentId} onChange={e => setOrgForm({...orgForm, parentId: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50">
                    <option value="">（无上级）</option>
                    {orgs.filter(o => o.level < orgForm.level && o.id !== editingOrg?.id).map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">可查看数据源 (多选)</label>
                  <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 flex flex-col max-h-56">
                    <input 
                      type="text" 
                      placeholder="搜索数据源..." 
                      value={sourceSearch}
                      onChange={(e) => setSourceSearch(e.target.value)}
                      className="w-full px-2 py-1.5 mb-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                    <div className="overflow-y-auto flex-1 h-32">
                      {availableSources.filter(ds => ds.toLowerCase().includes(sourceSearch.toLowerCase())).map(ds => (
                         <label key={ds} className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 cursor-pointer rounded">
                           <input 
                             type="checkbox" 
                             checked={orgForm.dataSources.includes(ds)} 
                             onChange={(e) => {
                               const newDs = e.target.checked 
                                 ? [...orgForm.dataSources, ds] 
                                 : orgForm.dataSources.filter(x => x !== ds);
                               setOrgForm({...orgForm, dataSources: newDs});
                             }} 
                             className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300" 
                           />
                           <span className="text-sm text-slate-700 select-none block flex-1 break-all">{ds}</span>
                         </label>
                      ))}
                      {availableSources.filter(ds => ds.toLowerCase().includes(sourceSearch.toLowerCase())).length === 0 && (
                        <div className="text-center text-slate-400 text-sm py-4">无匹配的数据源</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsOrgModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">取消</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">保存</button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
