
import React, { useMemo, useState } from 'react';
import { AppData, User, TaskStatus } from '../types';
import { useLang } from '../App';

interface EmployeeStatsProps {
  data: AppData;
}

type WorkloadView = 'person' | 'team' | 'project';

const EmployeeStats: React.FC<EmployeeStatsProps> = ({ data }) => {
  const { lang, t } = useLang();
  const [viewMode, setViewMode] = useState<WorkloadView>('person');
  const STANDARD_CAPACITY = 176; // Monthly standard hours


  // ─── Per-person stats ───
  const workloadByEmployee = useMemo(() => {
    const stats: Record<string, { count: number; hours: number; tasks: any[] }> = {};
    data.users.forEach(u => { stats[u.id] = { count: 0, hours: 0, tasks: [] }; });
    data.tasks.forEach(task => {
      task.phases.forEach(phase => {
        if (stats[phase.userId] && phase.status !== TaskStatus.DONE) {
          stats[phase.userId].count += 1;
          const taskType = data.taskTypes.find(tt => tt.id === task.taskTypeId);
          const estHours = taskType?.estimatedHours[phase.teamId] || 0;
          stats[phase.userId].hours += estHours;
          stats[phase.userId].tasks.push({ title: task.title, status: phase.status });
        }
      });
    });
    return stats;
  }, [data]);

  // ─── Per-team stats ───
  const workloadByTeam = useMemo(() => {
    const stats: Record<string, { totalTasks: number; totalHours: number; activeMembers: number; capacityHours: number }> = {};
    data.departments.forEach(d => {
      const members = data.users.filter(u => u.departmentId === d.id && u.status === 'active');
      stats[d.id] = { totalTasks: 0, totalHours: 0, activeMembers: members.length, capacityHours: members.length * STANDARD_CAPACITY };
    });
    data.tasks.forEach(task => {
      task.phases.forEach(phase => {
        if (phase.status !== TaskStatus.DONE && stats[phase.teamId]) {
          stats[phase.teamId].totalTasks += 1;
          const taskType = data.taskTypes.find(tt => tt.id === task.taskTypeId);
          stats[phase.teamId].totalHours += taskType?.estimatedHours[phase.teamId] || 0;
        }
      });
    });
    return stats;
  }, [data]);

  // ─── Per-project stats ───
  const workloadByProject = useMemo(() => {
    return data.projects.filter(p => p.status === 'active').map(project => {
      const tasks = data.tasks.filter(t => t.projectId === project.id);
      const totalPhases = tasks.reduce((s, t) => s + t.phases.length, 0);
      const donePhases = tasks.reduce((s, t) => s + t.phases.filter(p => p.status === TaskStatus.DONE).length, 0);
      const totalHours = tasks.reduce((s, task) => {
        const tt = data.taskTypes.find(x => x.id === task.taskTypeId);
        return s + task.phases.reduce((ps, phase) => ps + (tt?.estimatedHours[phase.teamId] || 0), 0);
      }, 0);
      return { project, taskCount: tasks.length, totalPhases, donePhases, totalHours, progress: totalPhases > 0 ? Math.round((donePhases / totalPhases) * 100) : 0 };
    });
  }, [data]);

  const employeesByDept = useMemo(() => {
    const groups: Record<string, User[]> = {};
    data.departments.forEach(d => groups[d.id] = []);
    data.users.forEach(u => { if (u.status === 'active') groups[u.departmentId]?.push(u); });
    return groups;
  }, [data]);

  const getWorkloadColor = (hours: number) => {
    if (hours === 0) return 'bg-green-50 text-green-700 border-green-200';
    if (hours < 20) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (hours < 40) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (hours < 60) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getHeatColor = (hours: number) => {
    if (hours === 0) return 'bg-green-100';
    if (hours < 20) return 'bg-emerald-200';
    if (hours < 40) return 'bg-yellow-200';
    if (hours < 60) return 'bg-orange-300';
    return 'bg-red-500 text-white';
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-auto custom-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('workload_title')}</h2>
          <p className="text-slate-500">{t('workload_desc')}</p>
        </div>
        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          {(['person', 'team', 'project'] as WorkloadView[]).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${viewMode === mode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
              {t(`workload_view_${mode}`)}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ BY PERSON ═══════ */}
      {viewMode === 'person' && (
        <div className="grid grid-cols-1 gap-8">
          {data.departments.map(dept => (
            <div key={dept.id} className="space-y-4">
              <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                {lang === 'en' ? `Team: ${dept.name}` : `ทีม ${dept.name}`}
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {employeesByDept[dept.id]?.length || 0} {lang === 'en' ? 'persons' : 'คน'}
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {employeesByDept[dept.id]?.map(user => {
                  const stats = workloadByEmployee[user.id];
                  const atCapacity = stats.hours >= STANDARD_CAPACITY;
                  const utilization = Math.min(100, Math.round((stats.hours / STANDARD_CAPACITY) * 100));
                  return (
                    <div key={user.id} className={`p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${getWorkloadColor(stats.hours)}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-slate-900">{user.name}</h4>
                          <p className="text-[10px] uppercase opacity-60 font-bold">{dept.name}</p>
                          {(user.skills || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {user.skills!.slice(0, 3).map((s, i) => (
                                <span key={i} className="text-[9px] bg-black/5 px-1 py-0.5 rounded">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full font-bold shadow-inner ${getHeatColor(stats.hours)}`}>
                          {stats.hours} {lang === 'en' ? 'hrs' : 'ชม.'}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex-1">
                          <div className="text-[10px] uppercase opacity-60 font-bold mb-1">{t('workload_pending')}</div>
                          <div className="text-xl font-black flex items-baseline gap-1">
                            {stats.hours} <span className="text-sm font-normal text-slate-400">/ {STANDARD_CAPACITY} {lang === 'en' ? 'hrs' : 'ชม.'}</span>
                          </div>
                          {atCapacity && <span className="text-[9px] text-red-500 font-bold">{lang === 'en' ? 'OVER CAPACITY' : 'เกินเวลา'}</span>}
                        </div>
                        <div className="h-10 w-1 bg-current opacity-10 rounded-full"></div>
                        <div className="flex-1">
                          <div className="text-[10px] uppercase opacity-60 font-bold mb-1">{t('workload_density')}</div>
                          <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden mt-2">
                            <div className={`h-full transition-all duration-1000 ${utilization > 100 ? 'bg-red-500' : 'bg-current'}`} style={{ width: `${Math.min(100, utilization)}%` }}></div>
                          </div>
                          <div className="text-xs font-bold mt-1 text-right">{utilization}%</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-current/10">
                        <div className="text-[10px] uppercase font-bold opacity-60 mb-2">{t('workload_recent')}:</div>
                        <div className="flex flex-col gap-1">
                          {stats.tasks.slice(0, 2).map((t_item, i) => (
                            <div key={i} className="text-[11px] truncate flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-current"></span>
                              {t_item.title} ({t(`status.${t_item.status}`)})
                            </div>
                          ))}
                          {stats.tasks.length > 2 && (
                            <div className="text-[10px] italic opacity-60">{lang === 'en' ? `and ${stats.tasks.length - 2} more...` : `และอีก ${stats.tasks.length - 2} งาน...`}</div>
                          )}
                          {stats.tasks.length === 0 && (
                            <div className="text-[10px] italic opacity-60">{t('workload_empty')}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════ BY TEAM ═══════ */}
      {viewMode === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.departments.map(dept => {
            const stats = workloadByTeam[dept.id];
            const utilization = stats.capacityHours > 0 ? Math.round((stats.totalHours / stats.capacityHours) * 100) : 0;
            return (
              <div key={dept.id} className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{dept.name}</h3>
                    <p className="text-xs text-slate-400">{stats.activeMembers} {lang === 'en' ? 'active members' : 'สมาชิก'}</p>
                  </div>
                  <div className={`text-sm px-3 py-1 rounded-full font-bold ${utilization > 80 ? 'bg-red-100 text-red-600' : utilization > 50 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                    {utilization}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-[10px] uppercase font-bold text-slate-400">{t('workload_demand')}</div>
                    <div className="text-xl font-black text-slate-800">{stats.totalHours} <span className="text-sm font-normal">{lang === 'en' ? 'hrs' : 'ชม.'}</span></div>
                    <div className="text-xs text-slate-500">{stats.totalTasks} {lang === 'en' ? 'tasks' : 'งาน'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-[10px] uppercase font-bold text-slate-400">{t('workload_capacity')}</div>
                    <div className="text-xl font-black text-slate-800">{stats.capacityHours} <span className="text-sm font-normal">{lang === 'en' ? 'hrs' : 'ชม.'}</span></div>
                    <div className="text-xs text-slate-500">{lang === 'en' ? 'monthly capacity' : 'ความจุรายเดือน'}</div>
                  </div>
                </div>

                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${utilization > 80 ? 'bg-red-500' : utilization > 50 ? 'bg-yellow-400' : 'bg-green-400'}`}
                    style={{ width: `${Math.min(100, utilization)}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 text-right">{lang === 'en' ? 'Capacity Utilization' : 'การใช้งานความจุ'}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════ BY PROJECT ═══════ */}
      {viewMode === 'project' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workloadByProject.map(({ project, taskCount, totalPhases, donePhases, totalHours, progress }) => (
            <div key={project.id} className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs font-mono font-bold text-blue-500 mb-1">[{project.codename}]</div>
                  <h3 className="text-lg font-bold text-slate-800">{project.name}</h3>
                </div>
                <div className={`text-sm px-3 py-1 rounded-full font-bold ${progress === 100 ? 'bg-green-100 text-green-600' : progress >= 50 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                  {progress}%
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-2 bg-slate-50 rounded-lg text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">{lang === 'en' ? 'Tasks' : 'งาน'}</div>
                  <div className="text-lg font-black text-slate-800">{taskCount}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">{lang === 'en' ? 'Phases' : 'ขั้นตอน'}</div>
                  <div className="text-lg font-black text-slate-800">{donePhases}/{totalPhases}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">{lang === 'en' ? 'Hours' : 'ชั่วโมง'}</div>
                  <div className="text-lg font-black text-slate-800">{totalHours}</div>
                </div>
              </div>

              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 text-right">{lang === 'en' ? 'Stage Progress' : 'ความคืบหน้า'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeStats;
