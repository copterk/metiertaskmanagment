import React, { useState, useMemo } from 'react';
import { AppData, Department, TaskTypeConfig, User, Project, TaskTemplate, ActivityLogEntry } from '../types';
import { Icons } from '../constants';
import { useLang } from '../App';

type SettingsTab = 'depts' | 'types' | 'members' | 'projects' | 'templates' | 'logs';

interface SettingsProps {
  data: AppData;
  onUpdateData: (data: AppData) => void;
  addLog: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
}

const Settings: React.FC<SettingsProps> = ({ data, onUpdateData, addLog }) => {
  const { lang, t } = useLang();
  const [activeTab, setActiveTab] = useState<SettingsTab>('depts');

  // ─── Department Logic ───
  const addDepartment = () => {
    const name = prompt(lang === 'en' ? 'New team name:' : 'ชื่อทีม/แผนกใหม่:');
    if (!name) return;
    const newDept: Department = { id: `d_${Date.now()}`, name };
    addLog({ entityType: 'department', entityId: newDept.id, action: 'create', newValue: name });
    onUpdateData({ ...data, departments: [...data.departments, newDept] });
  };

  const deleteDepartment = (dept: Department) => {
    const msg = lang === 'en'
      ? `Delete team "${dept.name}"? This cannot be undone.`
      : `ลบทีม "${dept.name}" ใช่ไหม? การลบจะย้อนกลับไม่ได้`;
    if (!confirm(msg)) return;

    const isUsed = data.tasks.some(task => task.phases.some(p => p.teamId === dept.id));
    if (isUsed) {
      alert(lang === 'en'
        ? 'This team is used in existing tasks. Please remove/update those phases first.'
        : 'ทีมนี้ถูกใช้อยู่ในงานบางรายการ กรุณาแก้ไข/ลบ phase ที่อ้างอิงทีมนี้ก่อน');
      return;
    }

    const nextDepartments = data.departments.filter(d => d.id !== dept.id);
    const nextTaskTypes = data.taskTypes.map(tt => {
      const { [dept.id]: _, ...rest } = tt.estimatedHours || {};
      return { ...tt, estimatedHours: rest };
    });
    addLog({ entityType: 'department', entityId: dept.id, action: 'delete', oldValue: dept.name });
    onUpdateData({ ...data, departments: nextDepartments, taskTypes: nextTaskTypes });
  };

  // ─── Task Type Logic ───
  const addTaskType = () => {
    const name = prompt(lang === 'en' ? 'New task type name:' : 'ชื่อประเภทงานใหม่:');
    if (!name) return;
    const newType: TaskTypeConfig = { id: `tt_${Date.now()}`, name, estimatedHours: {} };
    addLog({ entityType: 'taskType', entityId: newType.id, action: 'create', newValue: name });
    onUpdateData({ ...data, taskTypes: [...data.taskTypes, newType] });
  };

  const updateHours = (typeId: string, deptId: string, hours: number) => {
    onUpdateData({
      ...data,
      taskTypes: data.taskTypes.map(tt => {
        if (tt.id === typeId) {
          return { ...tt, estimatedHours: { ...tt.estimatedHours, [deptId]: hours } };
        }
        return tt;
      })
    });
  };

  // ─── Member Logic ───
  const [memberForm, setMemberForm] = useState({ name: '', departmentId: '', role: 'user' as 'admin' | 'user', skills: '', capacity: 5 });
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberFilterDept, setMemberFilterDept] = useState('');

  const filteredMembers = useMemo(() => {
    let members = data.users;
    if (memberFilterDept) members = members.filter(u => u.departmentId === memberFilterDept);
    return members;
  }, [data.users, memberFilterDept]);

  const saveMember = () => {
    if (!memberForm.name.trim() || !memberForm.departmentId) {
      alert(lang === 'en' ? 'Name and Team are required.' : 'กรุณากรอกชื่อและเลือกทีม');
      return;
    }
    const skills = memberForm.skills.split(',').map(s => s.trim()).filter(Boolean);
    if (editingMemberId) {
      const updated = data.users.map(u => u.id === editingMemberId ? {
        ...u, name: memberForm.name, departmentId: memberForm.departmentId,
        role: memberForm.role, skills, capacity: memberForm.capacity
      } : u);
      addLog({ entityType: 'user', entityId: editingMemberId, action: 'update', newValue: memberForm.name });
      onUpdateData({ ...data, users: updated });
      setEditingMemberId(null);
    } else {
      const newUser: User = {
        id: `u_${Date.now()}`, name: memberForm.name, departmentId: memberForm.departmentId,
        role: memberForm.role, status: 'active', skills, capacity: memberForm.capacity
      };
      addLog({ entityType: 'user', entityId: newUser.id, action: 'create', newValue: memberForm.name });
      onUpdateData({ ...data, users: [...data.users, newUser] });
    }
    setMemberForm({ name: '', departmentId: '', role: 'user', skills: '', capacity: 5 });
  };

  const startEditMember = (u: User) => {
    setEditingMemberId(u.id);
    setMemberForm({ name: u.name, departmentId: u.departmentId, role: u.role, skills: (u.skills || []).join(', '), capacity: u.capacity || 5 });
  };

  const toggleMemberStatus = (u: User) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    addLog({ entityType: 'user', entityId: u.id, action: 'update', field: 'status', oldValue: u.status, newValue: newStatus });
    onUpdateData({ ...data, users: data.users.map(x => x.id === u.id ? { ...x, status: newStatus } : x) });
  };

  // ─── Project Logic ───
  const [projectForm, setProjectForm] = useState({ codename: '', name: '', owner: '' });
  const addProject = () => {
    if (!projectForm.codename.trim() || !projectForm.name.trim()) {
      alert(lang === 'en' ? 'Codename and Display Name are required.' : 'กรุณากรอก Codename และชื่อแสดงผล');
      return;
    }
    const newProject: Project = {
      id: `p_${Date.now()}`, codename: projectForm.codename.toUpperCase(),
      name: projectForm.name, owner: projectForm.owner || undefined, status: 'active'
    };
    addLog({ entityType: 'project', entityId: newProject.id, action: 'create', newValue: `${newProject.codename}: ${newProject.name}` });
    onUpdateData({ ...data, projects: [...data.projects, newProject] });
    setProjectForm({ codename: '', name: '', owner: '' });
  };

  const toggleProjectStatus = (p: Project) => {
    const newStatus = p.status === 'active' ? 'closed' : 'active';
    addLog({ entityType: 'project', entityId: p.id, action: 'update', field: 'status', oldValue: p.status, newValue: newStatus });
    onUpdateData({ ...data, projects: data.projects.map(x => x.id === p.id ? { ...x, status: newStatus } : x) });
  };

  // ─── Template Logic ───
  const addTemplate = () => {
    const name = prompt(lang === 'en' ? 'Template name:' : 'ชื่อเทมเพลต:');
    if (!name) return;
    const taskTypeId = data.taskTypes.length > 0 ? data.taskTypes[0].id : '';
    const newTpl: TaskTemplate = {
      id: `tpl_${Date.now()}`, name, taskTypeId, defaultPhases: []
    };
    onUpdateData({ ...data, taskTemplates: [...data.taskTemplates, newTpl] });
  };

  const addPhaseToTemplate = (tplId: string) => {
    if (data.departments.length === 0) return;
    onUpdateData({
      ...data,
      taskTemplates: data.taskTemplates.map(tpl => {
        if (tpl.id !== tplId) return tpl;
        const order = tpl.defaultPhases.length + 1;
        return {
          ...tpl,
          defaultPhases: [...tpl.defaultPhases, { teamId: data.departments[0].id, order, dependsOnPrev: order > 1 }]
        };
      })
    });
  };

  const updateTemplatePhase = (tplId: string, idx: number, field: string, value: any) => {
    onUpdateData({
      ...data,
      taskTemplates: data.taskTemplates.map(tpl => {
        if (tpl.id !== tplId) return tpl;
        const phases = [...tpl.defaultPhases];
        phases[idx] = { ...phases[idx], [field]: value };
        return { ...tpl, defaultPhases: phases };
      })
    });
  };

  const deleteTemplate = (tplId: string) => {
    if (!confirm(lang === 'en' ? 'Delete this template?' : 'ลบเทมเพลตนี้?')) return;
    onUpdateData({ ...data, taskTemplates: data.taskTemplates.filter(t => t.id !== tplId) });
  };

  // ─── Tabs config ───
  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'depts', label: t('settings_tab_dept') },
    { key: 'members', label: t('settings_tab_members') },
    { key: 'types', label: t('settings_tab_types') },
    { key: 'projects', label: t('settings_tab_projects') },
    { key: 'templates', label: t('settings_tab_templates') },
    { key: 'logs', label: t('settings_tab_logs') },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col gap-6 overflow-auto custom-scrollbar">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{t('settings_title')}</h2>
        <p className="text-slate-500">{t('settings_desc')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-4 font-bold transition-all whitespace-nowrap text-sm ${activeTab === tab.key
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">

        {/* ═══════ DEPARTMENTS TAB ═══════ */}
        {activeTab === 'depts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-700">
                {lang === 'en' ? 'All Departments' : 'รายชื่อแผนกทั้งหมด'}
              </h4>
              <button onClick={addDepartment} className="flex items-center gap-1 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition">
                <Icons.Plus className="w-4 h-4" /> {lang === 'en' ? 'Add Team' : 'เพิ่มทีมใหม่'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.departments.map(d => (
                <div key={d.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between group">
                  <span className="font-medium text-slate-700">{d.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">{data.users.filter(u => u.departmentId === d.id && u.status === 'active').length} {lang === 'en' ? 'members' : 'คน'}</span>
                    <button onClick={() => deleteDepartment(d)} className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition" title={lang === 'en' ? 'Delete' : 'ลบ'}>
                      <Icons.X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ MEMBERS TAB ═══════ */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Add/Edit Form */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h4 className="font-bold text-slate-700 mb-3">{editingMemberId ? (lang === 'en' ? 'Edit Member' : 'แก้ไขสมาชิก') : t('member_add')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{t('member_name')}</label>
                  <input type="text" value={memberForm.name} onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{t('member_team')}</label>
                  <select value={memberForm.departmentId} onChange={e => setMemberForm(f => ({ ...f, departmentId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">{lang === 'en' ? 'Select Team' : 'เลือกทีม'}</option>
                    {data.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{t('member_role')}</label>
                  <select value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{t('member_skills')}</label>
                  <input type="text" value={memberForm.skills} onChange={e => setMemberForm(f => ({ ...f, skills: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="React, Figma, ..." />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{t('member_capacity')}</label>
                  <input type="number" value={memberForm.capacity} onChange={e => setMemberForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" min={1} max={20} />
                </div>
                <div className="flex items-end gap-2">
                  <button onClick={saveMember} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                    {editingMemberId ? (lang === 'en' ? 'Update' : 'อัปเดต') : (lang === 'en' ? 'Add' : 'เพิ่ม')}
                  </button>
                  {editingMemberId && (
                    <button onClick={() => { setEditingMemberId(null); setMemberForm({ name: '', departmentId: '', role: 'user', skills: '', capacity: 5 }); }}
                      className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition">{lang === 'en' ? 'Cancel' : 'ยกเลิก'}</button>
                  )}
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3">
              <select value={memberFilterDept} onChange={e => setMemberFilterDept(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">{lang === 'en' ? 'All Teams' : 'ทุกทีม'}</option>
                {data.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <span className="text-sm text-slate-400">{filteredMembers.length} {lang === 'en' ? 'members' : 'สมาชิก'}</span>
            </div>

            {/* Member Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">{t('member_name')}</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">{t('member_team')}</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">{t('member_role')}</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">{t('member_skills')}</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">{t('member_capacity')}</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">{t('member_status')}</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase text-right">{lang === 'en' ? 'Actions' : 'จัดการ'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map(u => {
                    const dept = data.departments.find(d => d.id === u.departmentId);
                    const currentTasks = data.tasks.filter(t => t.phases.some(p => p.userId === u.id && p.status !== 'DONE')).length;
                    return (
                      <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${u.status === 'inactive' ? 'opacity-50' : ''}`}>
                        <td className="p-3 font-medium text-slate-800">{u.name}</td>
                        <td className="p-3 text-sm text-slate-600">{dept?.name || '-'}</td>
                        <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>{u.role}</span></td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {(u.skills || []).map((s, i) => (
                              <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">{s}</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-sm">
                          <span className={`font-bold ${currentTasks >= (u.capacity || 5) ? 'text-red-500' : 'text-slate-600'}`}>
                            {currentTasks}/{u.capacity || 5}
                          </span>
                        </td>
                        <td className="p-3">
                          <button onClick={() => toggleMemberStatus(u)}
                            className={`text-[10px] px-2 py-1 rounded-full font-bold cursor-pointer transition ${u.status === 'active' ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                            {u.status === 'active' ? t('member_active') : t('member_inactive')}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => startEditMember(u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <Icons.Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════ TASK TYPES TAB ═══════ */}
        {activeTab === 'types' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-700">
                {lang === 'en' ? 'Estimated Hours per Team' : 'ชั่วโมงประเมินตามประเภทงาน'}
              </h4>
              <button onClick={addTaskType} className="flex items-center gap-1 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition">
                <Icons.Plus className="w-4 h-4" /> {lang === 'en' ? 'Add Type' : 'เพิ่มประเภทงาน'}
              </button>
            </div>
            <div className="space-y-6">
              {data.taskTypes.map(tt => (
                <div key={tt.id} className="p-5 border border-slate-100 rounded-xl bg-slate-50/50">
                  <h5 className="font-bold text-slate-800 mb-4 text-lg">{tt.name}</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {data.departments.map(dept => (
                      <div key={dept.id} className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">{dept.name}</label>
                        <div className="flex items-center gap-2">
                          <input type="number" value={tt.estimatedHours[dept.id] || 0}
                            onChange={(e) => updateHours(tt.id, dept.id, parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                          <span className="text-xs text-slate-400">{lang === 'en' ? 'h' : 'ชม.'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ PROJECTS TAB ═══════ */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Add Project Form */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h4 className="font-bold text-slate-700 mb-3">{t('project_add')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{t('project_codename')}</label>
                  <input type="text" value={projectForm.codename} onChange={e => setProjectForm(f => ({ ...f, codename: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="PHOENIX" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{t('project_display')}</label>
                  <input type="text" value={projectForm.name} onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Website Redesign" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{t('project_owner')}</label>
                  <select value={projectForm.owner} onChange={e => setProjectForm(f => ({ ...f, owner: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">{lang === 'en' ? 'None' : 'ไม่ระบุ'}</option>
                    {data.users.filter(u => u.status === 'active').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={addProject} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                    {lang === 'en' ? 'Add' : 'เพิ่ม'}
                  </button>
                </div>
              </div>
            </div>

            {/* Project List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">{t('project_codename')}</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">{t('project_display')}</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">{t('project_owner')}</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">{t('project_status')}</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase text-right">{lang === 'en' ? 'Tasks' : 'จำนวนงาน'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.projects.map(p => {
                    const owner = data.users.find(u => u.id === p.owner);
                    const taskCount = data.tasks.filter(t => t.projectId === p.id).length;
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${p.status === 'closed' ? 'opacity-50' : ''}`}>
                        <td className="p-3 font-mono font-bold text-blue-600 text-sm">{p.codename}</td>
                        <td className="p-3 font-medium text-slate-800">{p.name}</td>
                        <td className="p-3 text-sm text-slate-600">{owner?.name || '-'}</td>
                        <td className="p-3">
                          <button onClick={() => toggleProjectStatus(p)}
                            className={`text-[10px] px-2 py-1 rounded-full font-bold cursor-pointer transition ${p.status === 'active' ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                            {p.status === 'active' ? (lang === 'en' ? 'Active' : 'ใช้งาน') : (lang === 'en' ? 'Closed' : 'ปิด')}
                          </button>
                        </td>
                        <td className="p-3 text-right text-sm font-bold text-slate-600">{taskCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════ TEMPLATES TAB ═══════ */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-700">{lang === 'en' ? 'Task Templates' : 'เทมเพลตงาน'}</h4>
              <button onClick={addTemplate} className="flex items-center gap-1 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition">
                <Icons.Plus className="w-4 h-4" /> {t('template_add')}
              </button>
            </div>
            {data.taskTemplates.map(tpl => (
              <div key={tpl.id} className="p-5 border border-slate-100 rounded-xl bg-slate-50/50">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h5 className="font-bold text-slate-800 text-lg">{tpl.name}</h5>
                    <p className="text-xs text-slate-400">{lang === 'en' ? 'Type' : 'ประเภท'}: {data.taskTypes.find(tt => tt.id === tpl.taskTypeId)?.name || '-'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => addPhaseToTemplate(tpl.id)} className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition">
                      <Icons.Plus className="w-4 h-4 inline" /> {lang === 'en' ? 'Add Stage' : 'เพิ่มขั้นตอน'}
                    </button>
                    <button onClick={() => deleteTemplate(tpl.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Icons.Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {tpl.defaultPhases.map((phase, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                      <span className="text-sm font-bold text-slate-400 w-8">#{phase.order}</span>
                      <select value={phase.teamId} onChange={e => updateTemplatePhase(tpl.id, idx, 'teamId', e.target.value)}
                        className="border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500">
                        {data.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-xs text-slate-500">
                        <input type="checkbox" checked={phase.dependsOnPrev} onChange={e => updateTemplatePhase(tpl.id, idx, 'dependsOnPrev', e.target.checked)} />
                        {lang === 'en' ? 'Depends on prev' : 'รอขั้นตอนก่อนหน้า'}
                      </label>
                    </div>
                  ))}
                  {tpl.defaultPhases.length === 0 && <p className="text-sm text-slate-400 italic">{lang === 'en' ? 'No stages defined yet' : 'ยังไม่มีขั้นตอน'}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ ACTIVITY LOG TAB ═══════ */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-700">{lang === 'en' ? 'Activity Log' : 'ประวัติการแก้ไข'}</h4>
            {data.activityLog.length === 0 ? (
              <p className="text-slate-400 text-sm italic py-8 text-center">{t('log_empty')}</p>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-3 text-xs font-bold text-slate-500 uppercase">{t('log_time')}</th>
                      <th className="p-3 text-xs font-bold text-slate-500 uppercase">{t('log_action')}</th>
                      <th className="p-3 text-xs font-bold text-slate-500 uppercase">{t('log_entity')}</th>
                      <th className="p-3 text-xs font-bold text-slate-500 uppercase">{t('log_detail')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.activityLog.slice(0, 100).map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-xs text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US')}</td>
                        <td className="p-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${log.action === 'create' ? 'bg-green-100 text-green-600' :
                              log.action === 'update' ? 'bg-blue-100 text-blue-600' :
                                'bg-red-100 text-red-600'
                            }`}>{log.action}</span>
                        </td>
                        <td className="p-3 text-sm">
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{log.entityType}</span>
                        </td>
                        <td className="p-3 text-sm text-slate-600">
                          {log.field && <span className="text-slate-400">{log.field}: </span>}
                          {log.oldValue && <span className="line-through text-red-400 mr-1">{log.oldValue}</span>}
                          {log.newValue && <span className="text-green-600">{log.newValue}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Settings;
