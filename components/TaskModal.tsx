import React, { useState, useEffect } from 'react';
import { AppData, Task, TaskPhase, TaskStatus } from '../types';
import { Icons, PRIORITY_COLORS } from '../constants';
import { useLang } from '../App';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
  task: Task | null;
  onSave: (task: Task) => void;
}

/** ===== Helpers for date/time (backward compatible) ===== */
const getDatePart = (value: string) => (value || '').split('T')[0] || '';
const getTimePart = (value: string, fallback: string) => {
  if (!value) return fallback;
  const parts = value.split('T');
  if (parts.length < 2) return fallback;
  // supports "HH:mm", "HH:mm:ss", "HH:mm:ssZ"
  const time = parts[1].slice(0, 5);
  return time && /^\d{2}:\d{2}$/.test(time) ? time : fallback;
};

const toLocalISODateOnly = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().split('T')[0];
};

const combineDateTime = (date: string, time: string) => {
  // store as ISO-like local datetime without timezone
  // (works with new Date(...) in browser; interpreted as local in most cases)
  if (!date) return '';
  if (!time) return `${date}T00:00:00`;
  return `${date}T${time}:00`;
};

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, data, task, onSave }) => {
  const { lang, t } = useLang();
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [taskTypeId, setTaskTypeId] = useState('');
  const [link, setLink] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [delayReason, setDelayReason] = useState('');
  const [phases, setPhases] = useState<TaskPhase[]>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setProjectId(task.projectId);
      setTaskTypeId(task.taskTypeId);
      setLink(task.link || '');
      setPriority(task.priority || 'medium');
      setDelayReason(task.delayReason || '');
      setPhases([...task.phases]);
    } else {
      setTitle('');
      setProjectId(data.projects.filter(p => p.status === 'active')[0]?.id || '');
      setTaskTypeId(data.taskTypes[0]?.id || '');
      setLink('');
      setPriority('medium');
      setDelayReason('');
      setPhases([]);
    }
  }, [task, data]);

  const addPhase = () => {
    const firstDept = data.departments[0];
    const activeUsersInDept = data.users.filter(u => u.departmentId === firstDept?.id && u.status === 'active');
    const today = toLocalISODateOnly(new Date());

    // default working time
    const startTime = '09:30';
    const endTime = '18:30';

    const newPhase: TaskPhase = {
      id: `ph_${Date.now()}_${phases.length}`,
      teamId: firstDept?.id || '',
      userId: activeUsersInDept[0]?.id || data.users[0]?.id || '',
      startDate: combineDateTime(today, startTime),
      endDate: combineDateTime(today, endTime),
      status: TaskStatus.NOT_STARTED,
      order: phases.length + 1,
      dependsOn: phases.length > 0 ? phases[phases.length - 1].id : undefined,
    };
    setPhases([...phases, newPhase]);
  };

  const applyTemplate = (tplId: string) => {
    const tpl = data.taskTemplates.find(t => t.id === tplId);
    if (!tpl) return;

    setTaskTypeId(tpl.taskTypeId);

    const today = toLocalISODateOnly(new Date());
    const startTime = '09:30';
    const endTime = '18:30';

    const base = Date.now(); // keep ids consistent for dependsOn
    const newPhases: TaskPhase[] = tpl.defaultPhases.map((dp, i) => {
      const activeInTeam = data.users.filter(u => u.departmentId === dp.teamId && u.status === 'active');
      return {
        id: `ph_${base}_${i}`,
        teamId: dp.teamId,
        userId: activeInTeam[0]?.id || '',
        startDate: combineDateTime(today, startTime),
        endDate: combineDateTime(today, endTime),
        status: TaskStatus.NOT_STARTED,
        order: dp.order,
        dependsOn: dp.dependsOnPrev && i > 0 ? `ph_${base}_${i - 1}` : undefined,
      };
    });

    setPhases(newPhases);
  };

  const updatePhase = (id: string, updates: Partial<TaskPhase>) => {
    setPhases(phases.map(p => {
      if (p.id !== id) return p;

      const updated: TaskPhase = { ...p, ...updates };

      // If team changed, auto-select first active user in new team
      if (updates.teamId && updates.teamId !== p.teamId) {
        const usersInNewTeam = data.users.filter(u => u.departmentId === updates.teamId && u.status === 'active');
        updated.userId = usersInNewTeam[0]?.id || '';
      }

      return updated;
    }));
  };

  const removePhase = (id: string) => {
    setPhases(phases.filter(p => p.id !== id));
  };

  const handleSave = () => {
    if (!title || !projectId || !taskTypeId || phases.length === 0) {
      alert(lang === 'en' ? 'Please fill all required fields and add at least 1 phase.' : 'กรุณากรอกข้อมูลให้ครบถ้วน และเพิ่มอย่างน้อย 1 ทีมที่รับผิดชอบ');
      return;
    }

    // Validate dates & times
    for (const p of phases) {
      const s = new Date(p.startDate);
      const e = new Date(p.endDate);

      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        alert(lang === 'en' ? 'Invalid date/time in a phase.' : 'วันที่/เวลาในบางขั้นตอนไม่ถูกต้อง');
        return;
      }
      if (s > e) {
        alert(t('validation_date'));
        return;
      }
    }

    const newTask: Task = {
      id: task?.id || `t_${Date.now()}`,
      title,
      projectId,
      taskTypeId,
      link: link || undefined,
      priority,
      delayReason: delayReason || undefined,
      phases
    };

    onSave(newTask);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">{task ? t('modal_edit') : t('modal_create')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
            <Icons.X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Template Selection */}
          {!task && data.taskTemplates.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <label className="text-sm font-bold text-blue-700 mr-3">{t('modal_use_template')}:</label>
              <select
                onChange={e => { if (e.target.value) applyTemplate(e.target.value); }}
                className="px-3 py-1.5 border border-blue-200 rounded-lg text-sm bg-white outline-none"
              >
                <option value="">{lang === 'en' ? 'Select template...' : 'เลือกเทมเพลต...'}</option>
                {data.taskTemplates.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t('modal_field_title')} *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={lang === 'en' ? 'Enter task title...' : 'ระบุชื่อโปรเจกต์ย่อย...'}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t('modal_field_type')} *</label>
              <select
                value={taskTypeId}
                onChange={(e) => setTaskTypeId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                {data.taskTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t('modal_field_project')} *</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                {data.projects.filter(p => p.status === 'active').map(p => (
                  <option key={p.id} value={p.id}>[{p.codename}] {p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t('modal_field_priority')}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                  <option key={p} value={p}>{t(`priority.${p}`)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t('modal_field_link')}</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t('modal_field_delay_reason')}</label>
              <input
                type="text"
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={lang === 'en' ? 'Optional: reason for delay' : 'ไม่จำเป็น: เหตุผลการล่าช้า'}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">{t('modal_phases')}</h3>
              <button
                onClick={addPhase}
                className="text-sm text-blue-600 font-bold flex items-center gap-1 hover:underline"
              >
                <Icons.Plus className="w-4 h-4" /> {t('modal_add_phase')}
              </button>
            </div>

            {phases.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-100 rounded-xl text-center text-slate-400">
                {lang === 'en' ? 'No phases added yet. Use a template or add phases manually.' : 'ยังไม่มีการมอบหมายงาน กรุณาเลือกเทมเพลตหรือเพิ่มขั้นตอน'}
              </div>
            ) : (
              <div className="space-y-3">
                {phases.map((p, index) => {
                  const startDateOnly = getDatePart(p.startDate);
                  const endDateOnly = getDatePart(p.endDate);
                  const startTime = getTimePart(p.startDate, '09:30');
                  const endTime = getTimePart(p.endDate, '18:30');

                  return (
                    <div key={p.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group">
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                        {index + 1}
                      </div>

                      {/* ✅ เพิ่มเวลา: ปรับ grid เป็น 6 คอลัมน์ */}
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">{t('modal_team')}</label>
                          <select
                            value={p.teamId}
                            onChange={(e) => updatePhase(p.id, { teamId: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs"
                          >
                            {data.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">{t('modal_assignee')}</label>
                          <select
                            value={p.userId}
                            onChange={(e) => updatePhase(p.id, { userId: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs"
                          >
                            {data.users.filter(u => u.departmentId === p.teamId && u.status === 'active').map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Period (dates) */}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">{t('modal_period')}</label>
                          <div className="flex gap-1">
                            <input
                              type="date"
                              value={startDateOnly}
                              onChange={(e) => {
                                const newDate = e.target.value;
                                const curTime = getTimePart(p.startDate, '09:30');
                                updatePhase(p.id, { startDate: combineDateTime(newDate, curTime) });
                              }}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-[10px]"
                            />
                            <input
                              type="date"
                              value={endDateOnly}
                              onChange={(e) => {
                                const newDate = e.target.value;
                                const curTime = getTimePart(p.endDate, '18:30');
                                updatePhase(p.id, { endDate: combineDateTime(newDate, curTime) });
                              }}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-[10px]"
                            />
                          </div>

                          {/* ✅ เวลาทำงาน */}
                          <div className="flex gap-1 mt-1">
                            <input
                              type="time"
                              value={startTime}
                              min="09:30"
                              max="18:30"
                              step={1800} // 30 นาที
                              onChange={(e) => {
                                const newTime = e.target.value;
                                const curDate = getDatePart(p.startDate) || toLocalISODateOnly(new Date());
                                updatePhase(p.id, { startDate: combineDateTime(curDate, newTime) });
                              }}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-[10px]"
                              title={lang === 'en' ? 'Start time' : 'เวลาเริ่ม'}
                            />
                            <input
                              type="time"
                              value={endTime}
                              min="09:30"
                              max="18:30"
                              step={1800}
                              onChange={(e) => {
                                const newTime = e.target.value;
                                const curDate = getDatePart(p.endDate) || toLocalISODateOnly(new Date());
                                updatePhase(p.id, { endDate: combineDateTime(curDate, newTime) });
                              }}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-[10px]"
                              title={lang === 'en' ? 'End time' : 'เวลาสิ้นสุด'}
                            />
                          </div>

                          <div className="text-[9px] text-slate-400 mt-1">
                            {lang === 'en' ? 'Work hours: 09:30–18:30 (30-min steps)' : 'เวลาทำงาน: 09:30–18:30 (ทีละ 30 นาที)'}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">{t('modal_status')}</label>
                          <select
                            value={p.status}
                            onChange={(e) => updatePhase(p.id, { status: e.target.value as TaskStatus })}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs"
                          >
                            {Object.values(TaskStatus).map(s => (
                              <option key={s} value={s}>{t(`status.${s}`)}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-end pb-1 justify-end">
                          <button onClick={() => removePhase(p.id)} className="p-2 text-slate-300 hover:text-red-500 transition">
                            <Icons.X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Dependency indicator */}
                      {p.dependsOn && (
                        <div className="mt-2 text-[9px] text-blue-500 font-bold flex items-center gap-1">
                          <Icons.Clock className="w-3 h-3" />
                          {lang === 'en'
                            ? `Depends on Phase #${phases.findIndex(x => x.id === p.dependsOn) + 1}`
                            : `รอขั้นตอนที่ #${phases.findIndex(x => x.id === p.dependsOn) + 1}`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-200 transition">
            {t('modal_btn_cancel')}
          </button>
          <button onClick={handleSave} className="px-8 py-2 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
            {task ? t('modal_btn_save') : t('modal_btn_create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
