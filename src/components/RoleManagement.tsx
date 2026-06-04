import { useState, useEffect } from 'react';
import { Plus, Search, ShieldCheck } from 'lucide-react';
import type { Role } from '../types';

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] as string[] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [rolesRes, accsRes] = await Promise.all([
      fetch('/api/roles'),
      fetch('/api/accounts')
    ]);
    const [rolesData, accsData] = await Promise.all([rolesRes.json(), accsRes.json()]);
    setRoles(rolesData);
    setAccounts(accsData);
    setLoading(false);
  };

  const openModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({ name: role.name, description: role.description || '', permissions: role.permissions || [] });
    } else {
      setEditingRole(null);
      setRoleForm({ name: '', description: '', permissions: [] });
    }
    setIsModalOpen(true);
  };

  const saveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: roleForm.name,
      description: roleForm.description,
      permissions: roleForm.permissions
    };

    if (editingRole) {
      await fetch(`/api/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    setIsModalOpen(false);
    fetchData();
  };

  const deleteRole = async (id: string) => {
    if (!confirm("确定删除该角色吗？")) return;
    await fetch(`/api/roles/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const PERMISSION_TREE = [
    { id: "chat", label: "智能问答" },
    { id: "org", label: "组织架构", children: [
        { id: "org_view", label: "查看组织架构列表" },
        { id: "org_add", label: "新增架构" },
        { id: "org_edit", label: "编辑架构" },
        { id: "org_delete", label: "删除架构" }
    ]},
    { id: "role", label: "角色管理", children: [
        { id: "role_view", label: "查看角色管理列表" },
        { id: "role_add", label: "新增角色" },
        { id: "role_edit", label: "编辑角色" },
        { id: "role_delete", label: "删除角色" }
    ]},
    { id: "account", label: "账号管理", children: [
        { id: "account_view", label: "查看账号管理列表" },
        { id: "account_add", label: "新增账号" },
        { id: "account_edit", label: "编辑账号（含重置密码）" },
        { id: "account_delete", label: "删除账号" }
    ]}
  ];

  const handleTogglePermission = (id: string, checked: boolean) => {
    const node = PERMISSION_TREE.find(n => n.id === id);
    let idsToToggle: string[] = [id];
    if (node && node.children) {
      idsToToggle = [id, ...node.children.map(c => c.id)];
    }

    setRoleForm(prev => {
      let newPerms = new Set(prev.permissions);
      idsToToggle.forEach(i => {
        if (checked) newPerms.add(i);
        else newPerms.delete(i);
      });
      return { ...prev, permissions: Array.from(newPerms) };
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">角色管理</h1>
          <p className="text-slate-500 mt-1 text-sm">配置系统角色及各角色的功能权限</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-sm">
          <Plus size={18} />
          新建角色
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 relative">
           <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="搜索角色名称..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4">序号</th>
                <th className="px-6 py-4">角色名称</th>
                <th className="px-6 py-4">角色描述</th>
                <th className="px-6 py-4">使用人数</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <div className="animate-pulse flex items-center justify-center gap-2">
                      <ShieldCheck className="text-slate-300" size={20} />
                      正在加载角色数据...
                    </div>
                  </td>
                </tr>
              ) : roles.map((role, idx) => {
                const count = accounts.filter(a => a.roleId === role.id).length;
                return (
                  <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{idx + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                         <ShieldCheck size={16} />
                       </div>
                       {role.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm max-w-xs truncate">
                      {role.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 rounded-lg text-sm">{count} 人</span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                      <button onClick={() => openModal(role)} className="text-blue-600 hover:text-blue-800">编辑权限</button>
                      <button onClick={() => deleteRole(role.id)} className="text-red-500 hover:text-red-700">删除</button>
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
               <h2 className="text-lg font-bold text-slate-800">{editingRole ? '编辑角色' : '新建角色'}</h2>
             </div>
             <form onSubmit={saveRole} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">角色名称</label>
                  <input required value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">角色描述</label>
                  <input value={roleForm.description} onChange={e => setRoleForm({...roleForm, description: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">功能权限配置</label>
                  <div className="border border-slate-200 rounded-lg p-3 max-h-64 overflow-y-auto bg-slate-50 space-y-2">
                    {PERMISSION_TREE.map(node => (
                      <div key={node.id} className="mb-2">
                        <label className="flex items-center space-x-2 font-medium text-slate-800">
                          <input 
                            type="checkbox" 
                            checked={roleForm.permissions.includes(node.id)}
                            onChange={e => handleTogglePermission(node.id, e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500" 
                          />
                          <span>{node.label}</span>
                        </label>
                        {node.children && (
                          <div className="ml-6 mt-1 space-y-1">
                             {node.children.map(child => (
                               <label key={child.id} className="flex items-center space-x-2 text-slate-600 text-sm">
                                 <input 
                                   type="checkbox" 
                                   checked={roleForm.permissions.includes(child.id)}
                                   onChange={e => handleTogglePermission(child.id, e.target.checked)}
                                   className="rounded text-blue-600 focus:ring-blue-500" 
                                 />
                                 <span>{child.label}</span>
                               </label>
                             ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
