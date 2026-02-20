import React, { useState, useMemo } from 'react';
import { AppData, Task, TaskStatus, TimelineHealth } from '../types';
import { Icons, STATUS_COLORS, PRIORITY_COLORS } from '../constants';
import { useLang } from '../App';

interface AdminDashboardProps {
  data: AppData;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onUpdateData: (data: AppData) => void;
}

/** ================= Helpers (Health/Delay) ================= **/
function getTaskHealth(task: Task): TimelineHealth {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const activePhases = task.phases.filter(p => p.status !== TaskStatus.DONE);
  if (activePhases.length === 0) return 'on-track';

  for (const phase of activePhases) {
    const due = new Date(phase.endDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'delayed';
    if (diffDays <= 2) return 'at-risk';
  }
  return 'on-track';
}

function getDelayDays(task: Task): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let maxDelay = 0;
  for (const phase of task.phases) {
    if (phase.status === TaskStatus.DONE) continue;
    const due = new Date(phase.endDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > maxDelay) maxDelay = diff;
  }
  return maxDelay;
}

/** ================= Helpers (Date Filters like TimelineView) ================= **/
const toISODate = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().split('T')[0];
};

const parseISODate = (s: string) => {
  const d = new Date(s);
  d.setHours(0, 0, 0, 0);
  return d;
};

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => {
  return aStart.getTime() <= bEnd.getTime() && aEnd.getTime() >= bStart.getTime();
};

const startOfWeek = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  // Monday as start
  const day = x.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  return x;
};

const endOfWeek = (d: Date) => {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  e.setHours(0, 0, 0, 0);
  return e;
};

const startOfMonth = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(1);
  return x;
};

const endOfMonth = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setMonth(x.getMonth() + 1, 0);
  return x;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ data, onEditTask, onDeleteTask, onUpdateData }) => {
  const { lang, t } = useLang();

  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState<'start' | 'end' | 'delay'>('start');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  // ✅ Date filters (same concept as TimelineView)
  const [filterStart, setFilterStart] = useState<string>(''); // YYYY-MM-DD
  const [filterEnd, setFilterEnd] = useState<string>('');     // YYYY-MM-DD

  const processedTasks = useMemo(() => {
    let tasks = [...data.tasks];

    // search / dropdown filters
    if (search) tasks = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    if (filterProject) tasks = tasks.filter(t => t.projectId === filterProject);
    if (filterTeam) tasks = tasks.filter(t => t.phases.some(p => p.teamId === filterTeam));
    if (filterStatus) tasks = tasks.filter(t => t.phases.some(p => p.status === filterStatus));

    // ✅ Date range filter (phase overlaps selected window)
    if (filterStart || filterEnd) {
      const start = filterStart ? parseISODate(filterStart) : null;
      const end = filterEnd ? parseISODate(filterEnd) : null;

      // normalize if user accidentally swaps
      const s = start && end ? (start.getTime() <= end.getTime() ? start : end) : (start || end)!;
      const e = start && end ? (start.getTime() <= end.getTime() ? end : start) : (start || end)!;

      tasks = tasks.filter(task =>
        task.phases.some(phase => {
          const ps = new Date(phase.startDate); ps.setHours(0, 0, 0, 0);
          const pe = new Date(phase.endDate); pe.setHours(0, 0, 0, 0);
          return overlaps(ps, pe, s, e);
        })
      );
    }

    // sort
    tasks.sort((a, b) => {
      if (sortBy === 'delay') return getDelayDays(b) - getDelayDays(a);

      const getLimitDate = (t: Task, mode: 'start' | 'end') => {
        if (t.phases.length === 0) return 0;
        const dates = t.phases.map(p =>
          new Date(mode === 'start' ? p.startDate : p.endDate).getTime()
        );
        return mode === 'start' ? Math.min(...dates) : Math.max(...dates);
      };

      return getLimitDate(a, sortBy) - getLimitDate(b, sortBy);
    });

    return tasks;
  }, [data.tasks, search, filterProject, filterTeam, filterStatus, sortBy, filterStart, filterEnd]);

  const toggleSelect = (id: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTasks.size === processedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(processedTasks.map(t => t.id)));
    }
  };

  const bulkUpdateStatus = (newStatus: TaskStatus) => {
    if (selectedTasks.size === 0) return;
    const updatedTasks = data.tasks.map(task => {
      if (!selectedTasks.has(task.id)) return task;
      return {
        ...task,
        phases: task.phases.map(p => p.status !== TaskStatus.DONE ? { ...p, status: newStatus } : p)
      };
    });
    onUpdateData({ ...data, tasks: updatedTasks });
    setSelectedTasks(new Set());
  };

  const bulkDelete = () => {
    if (selectedTasks.size === 0) return;
    const msg = lang === 'en' ? `Delete ${selectedTasks.size} tasks?` : `ลบ ${selectedTasks.size} งาน?`;
    if (!confirm(msg)) return;
    selectedTasks.forEach(id => onDeleteTask(id));
    setSelectedTasks(new Set());
  };

  const quickUpdatePhaseStatus = (taskId: string, phaseId: string, newStatus: TaskStatus) => {
    const updatedTasks = data.tasks.map(task => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        phases: task.phases.map(p => p.id === phaseId ? { ...p, status: newStatus } : p)
      };
    });
    onUpdateData({ ...data, tasks: updatedTasks });
  };

  const healthLabel = (health: TimelineHealth) => {
    const map: Record<TimelineHealth, { label: string; cls: string }> = {
      'on-track': { label: t('health_on_track'), cls: 'bg-green-100 text-green-600' },
      'at-risk': { label: t('health_at_risk'), cls: 'bg-orange-100 text-orange-600' },
      'delayed': { label: t('health_delayed'), cls: 'bg-red-100 text-red-600' },
    };
    return map[health];
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('admin_title')}</h2>
          <p className="text-slate-500">{t('admin_desc')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('admin_search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ✅ Date range filters + Quick buttons (like TimelineView) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterStart}
                onChange={(e) => setFilterStart(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                title={lang === 'en' ? 'Start date' : 'วันที่เริ่ม'}
              />
              <span className="text-slate-400 text-sm">–</span>
              <input
                type="date"
                value={filterEnd}
                onChange={(e) => setFilterEnd(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                title={lang === 'en' ? 'End date' : 'วันที่สิ้นสุด'}
              />

              {(filterStart || filterEnd) && (
                <button
                  onClick={() => { setFilterStart(''); setFilterEnd(''); }}
                  className="text-xs px-2 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                  title={lang === 'en' ? 'Clear date filter' : 'ล้างตัวกรองวันที่'}
                >
                  {lang === 'en' ? 'Clear' : 'ล้าง'}
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const today = new Date(); today.setHours(0, 0, 0, 0);
                  const iso = toISODate(today);
                  setFilterStart(iso);
                  setFilterEnd(iso);
                }}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                {lang === 'en' ? 'Today' : 'วันนี้'}
              </button>

              <button
                onClick={() => {
                  const now = new Date(); now.setHours(0, 0, 0, 0);
                  const s = startOfWeek(now);
                  const e = endOfWeek(now);
                  setFilterStart(toISODate(s));
                  setFilterEnd(toISODate(e));
                }}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                {lang === 'en' ? 'This week' : 'สัปดาห์นี้'}
              </button>

              <button
                onClick={() => {
                  const now = new Date(); now.setHours(0, 0, 0, 0);
                  const s = startOfWeek(now);
                  s.setDate(s.getDate() + 7);
                  const e = new Date(s);
                  e.setDate(s.getDate() + 6);
                  setFilterStart(toISODate(s));
                  setFilterEnd(toISODate(e));
                }}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                {lang === 'en' ? 'Next week' : 'สัปดาห์หน้า'}
              </button>

              <button
                onClick={() => {
                  const now = new Date(); now.setHours(0, 0, 0, 0);
                  const s = startOfMonth(now);
                  const e = endOfMonth(now);
                  setFilterStart(toISODate(s));
                  setFilterEnd(toISODate(e));
                }}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                {lang === 'en' ? 'This month' : 'เดือนนี้'}
              </button>
            </div>
          </div>

          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('admin_filter_project')}</option>
            {data.projects.filter(p => p.status === 'active').map(p => (
              <option key={p.id} value={p.id}>{p.codename}: {p.name}</option>
            ))}
          </select>

          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('admin_filter_team')}</option>
            {data.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('admin_filter_status')}</option>
            {Object.values(TaskStatus).map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="start">{t('admin_sort_start')}</option>
            <option value="end">{t('admin_sort_end')}</option>
            <option value="delay">{t('admin_sort_delay')}</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedTasks.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-4">
          <span className="text-sm font-bold text-blue-600">
            {selectedTasks.size} {lang === 'en' ? 'selected' : 'รายการ'}
          </span>

          <select
            onChange={e => { if (e.target.value) bulkUpdateStatus(e.target.value as TaskStatus); e.target.value = ''; }}
            className="border border-blue-200 rounded px-2 py-1 text-sm bg-white"
          >
            <option value="">{t('admin_bulk_status')}</option>
            {Object.values(TaskStatus).map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
          </select>

          <button
            onClick={bulkDelete}
            className="text-sm text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition font-medium"
          >
            <Icons.Trash className="w-4 h-4 inline mr-1" />
            {t('admin_bulk_delete')}
          </button>

          <button
            onClick={() => setSelectedTasks(new Set())}
            className="text-sm text-slate-500 hover:bg-slate-100 px-3 py-1 rounded-lg transition"
          >
            {lang === 'en' ? 'Clear' : 'ยกเลิก'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedTasks.size === processedTasks.length && processedTasks.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">{lang === 'en' ? 'Project / Task' : 'โปรเจกต์ / ชื่องาน'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">{lang === 'en' ? 'Health' : 'สถานะภาพ'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">{lang === 'en' ? 'Priority' : 'ลำดับ'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">{lang === 'en' ? 'Teams & Status' : 'ทีม & สถานะ'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">{lang === 'en' ? 'Employees' : 'พนักงาน'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">{lang === 'en' ? 'Period' : 'ช่วงเวลา'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">{lang === 'en' ? 'Link' : 'ลิงก์'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">{lang === 'en' ? 'Manage' : 'จัดการ'}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {processedTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    {lang === 'en' ? 'No data found' : 'ไม่พบข้อมูลงาน'}
                  </td>
                </tr>
              ) : (
                processedTasks.map(task => {
                  const project = data.projects.find(p => p.id === task.projectId);
                  const health = getTaskHealth(task);
                  const hLabel = healthLabel(health);
                  const delayDays = getDelayDays(task);

                  return (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(task.id)}
                          onChange={() => toggleSelect(task.id)}
                          className="rounded"
                        />
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-800">{task.title}</div>
                        <div className="text-xs text-blue-500 font-medium">
                          {project?.codename && <span className="font-mono mr-1">[{project.codename}]</span>}
                          {project?.name}
                        </div>
                        {delayDays > 0 && task.delayReason && (
                          <div className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                            <Icons.AlertTriangle className="w-3 h-3" /> {task.delayReason}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${hLabel.cls}`}>
                          {hLabel.label}
                          {delayDays > 0 && ` (${delayDays}d)`}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${PRIORITY_COLORS[task.priority || 'medium']}`}>
                          {t(`priority.${task.priority || 'medium'}`)}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {task.phases.map((p, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                {data.departments.find(d => d.id === p.teamId)?.name}
                              </span>
                              <select
                                value={p.status}
                                onChange={e => quickUpdatePhaseStatus(task.id, p.id, e.target.value as TaskStatus)}
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border outline-none cursor-pointer ${STATUS_COLORS[p.status]}`}
                              >
                                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {task.phases.map((p, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                              <span className="text-xs text-slate-600">{data.users.find(u => u.id === p.userId)?.name}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-xs text-slate-500 flex flex-col gap-1">
                          {task.phases.map((p, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <Icons.Clock className="w-3 h-3" />
                              {new Date(p.startDate).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                              {' - '}
                              {new Date(p.endDate).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-4">
                        {task.link ? (
                          <a href={task.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700">
                            <Icons.Link className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditTask(task)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Icons.Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if (confirm(lang === 'en' ? 'Delete this task?' : 'ลบงานนี้?')) onDeleteTask(task.id); }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Icons.Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
