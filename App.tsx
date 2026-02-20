
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { INITIAL_DATA } from './mockData';
import { AppData, Task, TaskStatus, User, Department, TaskTypeConfig, Project, Language, ActivityLogEntry, TaskTemplate } from './types';
import { Icons, COLORS, TRANSLATIONS } from './constants';
import AdminDashboard from './components/AdminDashboard';
import TimelineView from './components/TimelineView';
import EmployeeStats from './components/EmployeeStats';
import Settings from './components/Settings';
import TaskModal from './components/TaskModal';
import { api } from './api';

interface LangContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => any;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

export const useLang = () => {
  const context = useContext(LangContext);
  if (!context) throw new Error("useLang must be used within LangProvider");
  return context;
};

// ── Data loading from API ──────────────────────────────────────────────────

async function loadDataFromApi(): Promise<AppData> {
  try {
    const [projects, departments, users, taskTypes, tasks, activityLog, taskTemplates] = await Promise.all([
      api.getAll<Project>('projects'),
      api.getAll<Department>('departments'),
      api.getAll<User>('users'),
      api.getAll<TaskTypeConfig>('taskTypes'),
      api.getAll<Task>('tasks'),
      api.getAll<ActivityLogEntry>('activityLog'),
      api.getAll<TaskTemplate>('taskTemplates'),
    ]);
    return { projects, departments, users, taskTypes, tasks, activityLog, taskTemplates };
  } catch (err) {
    console.warn('⚠️ Could not reach API server, falling back to localStorage:', err);
    const saved = localStorage.getItem('project_flow_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  }
}

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('project_flow_lang');
    return (saved as Language) || 'en';
  });

  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load from API on mount
  useEffect(() => {
    loadDataFromApi().then(d => {
      setData(d);
      setLoading(false);
    }).catch(err => {
      setApiError(err.message);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('project_flow_lang', lang);
  }, [lang]);

  const t = (key: string) => {
    const keys = key.split('.');
    let val = TRANSLATIONS[lang];
    for (const k of keys) {
      val = val?.[k];
    }
    return val || key;
  };

  // Reload all data from API
  const refreshData = useCallback(async () => {
    try {
      const fresh = await loadDataFromApi();
      setData(fresh);
    } catch (err: any) {
      console.error('Failed to refresh data:', err.message);
    }
  }, []);

  // Activity log helper
  const addLog = useCallback(async (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
    const log: ActivityLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    try {
      await api.create('activityLog', log);
    } catch {
      // non-critical
    }
    setData(prev => ({
      ...prev,
      activityLog: [log, ...prev.activityLog].slice(0, 500),
    }));
  }, []);

  // ── handleUpdateData: for Settings (bulk updates) ──────────────────────
  const handleUpdateData = useCallback(async (newData: AppData) => {
    // For settings bulk edits we update the local state immediately and
    // individually sync changed entities to the API.
    setData(newData);
  }, []);

  const handleOpenTaskModal = (task?: Task) => {
    setEditingTask(task || null);
    setIsTaskModalOpen(true);
  };

  // ── Task CRUD ────────────────────────────────────────────────────────────

  const saveTask = useCallback(async (task: Task) => {
    const exists = data.tasks.find(t => t.id === task.id);
    try {
      if (exists) {
        await api.update('tasks', task.id, task);
        await addLog({ entityType: 'task', entityId: task.id, action: 'update', field: 'task', oldValue: exists.title, newValue: task.title });
      } else {
        await api.create('tasks', task);
        await addLog({ entityType: 'task', entityId: task.id, action: 'create', newValue: task.title });
      }
      await refreshData();
    } catch (err: any) {
      console.error('saveTask failed:', err.message);
      // fallback: update local state
      setData(prev => ({
        ...prev,
        tasks: exists
          ? prev.tasks.map(t => t.id === task.id ? task : t)
          : [...prev.tasks, task],
      }));
    }
    setIsTaskModalOpen(false);
  }, [data.tasks, addLog, refreshData]);

  const deleteTask = useCallback(async (taskId: string) => {
    const task = data.tasks.find(t => t.id === taskId);
    try {
      await api.delete('tasks', taskId);
      if (task) {
        await addLog({ entityType: 'task', entityId: taskId, action: 'delete', oldValue: task.title });
      }
      await refreshData();
    } catch (err: any) {
      console.error('deleteTask failed:', err.message);
      setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
    }
  }, [data.tasks, addLog, refreshData]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลจาก Google Sheets…</p>
        </div>
      </div>
    );
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      <HashRouter>
        <div className="flex flex-col h-screen overflow-hidden text-slate-900">
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <Icons.Layout className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800">Metier WorkFlow</h1>
              </div>
            </div>

            {apiError && (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md">
                ⚠️ ออฟไลน์ — ข้อมูล local
              </div>
            )}

            <nav className="hidden lg:flex items-center gap-1">
              <NavLink to="/" icon={<Icons.Calendar className="w-4 h-4" />} label={t('nav_timeline')} />
              <NavLink to="/admin" icon={<Icons.CheckCircle className="w-4 h-4" />} label={t('nav_admin')} />
              <NavLink to="/workload" icon={<Icons.Users className="w-4 h-4" />} label={t('nav_workload')} />
              <NavLink to="/settings" icon={<Icons.Settings className="w-4 h-4" />} label={t('nav_settings')} />
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenTaskModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm font-medium"
              >
                <Icons.Plus className="w-5 h-5" />
                <span className="hidden sm:inline">{t('btn_new_task')}</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-slate-50">
            <Routes>
              <Route path="/" element={<TimelineView data={data} onUpdateTask={saveTask} onEditTask={handleOpenTaskModal} />} />
              <Route path="/admin" element={<AdminDashboard data={data} onEditTask={handleOpenTaskModal} onDeleteTask={deleteTask} onUpdateData={handleUpdateData} />} />
              <Route path="/workload" element={<EmployeeStats data={data} />} />
              <Route path="/settings" element={<Settings data={data} onUpdateData={handleUpdateData} addLog={addLog} />} />
            </Routes>
          </main>

          {isTaskModalOpen && (
            <TaskModal
              isOpen={isTaskModalOpen}
              onClose={() => setIsTaskModalOpen(false)}
              data={data}
              task={editingTask}
              onSave={saveTask}
            />
          )}
        </div>
      </HashRouter>
    </LangContext.Provider>
  );
};

const NavLink: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-md flex items-center gap-2 transition font-medium ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

export default App;
