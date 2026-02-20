import React, { useState, useMemo } from 'react';
import { AppData, Task, TaskStatus } from '../types';
import { Icons, STATUS_COLORS, PRIORITY_COLORS } from '../constants';
import { useLang } from '../App';

const laneHeight = 14;
const barHeight = 30;
const topPad = 14;

// Day mode widths
const dayColWidth = 60;

// Work-hours (single day) config
const WORK_START_MIN = 9 * 60 + 30;  // 09:30
const WORK_END_MIN = 18 * 60 + 30;   // 18:30
const SLOT_MIN = 30;                 // 30 min per slot
const slotCount = (WORK_END_MIN - WORK_START_MIN) / SLOT_MIN; // 18 slots
const workSlotPx = 80;               // px per 30-min slot (adjust)

interface TimelineViewProps {
  data: AppData;
  onUpdateTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
}

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

// Supports YYYY-MM-DD or ISO datetime
const parseDateTime = (s: string) => {
  if (!s) return new Date(NaN);
  const d = new Date(s);
  if (isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + 'T00:00:00');
  return d;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// check overlap: [aStart,aEnd] overlaps [bStart,bEnd]
const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => {
  return aStart.getTime() <= bEnd.getTime() && aEnd.getTime() >= bStart.getTime();
};

const startOfWeek = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  // Monday as start of week
  const day = x.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
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
  x.setMonth(x.getMonth() + 1, 0); // last day of current month
  return x;
};

type DaySlot = { type: 'day'; date: Date };
type WorkSlot = { type: 'work'; idx: number; hh: number; mm: number };
type TimelineSlot = DaySlot | WorkSlot;

const TimelineView: React.FC<TimelineViewProps> = ({ data, onUpdateTask, onEditTask }) => {
  const { lang, t } = useLang();

  const [filterUser, setFilterUser] = useState<string>('');
  const [filterTeam, setFilterTeam] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'project' | 'person'>('project');

  // ✅ Date filters
  const [filterStart, setFilterStart] = useState<string>(''); // YYYY-MM-DD
  const [filterEnd, setFilterEnd] = useState<string>('');     // YYYY-MM-DD

  const isSingleDay = !!filterStart && !!filterEnd && filterStart === filterEnd;

  const timelineSlots: TimelineSlot[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const defaultStart = new Date(today);
    defaultStart.setDate(today.getDate() - 7);

    const defaultEnd = new Date(today);
    defaultEnd.setDate(today.getDate() + 21);

    const start = filterStart ? parseISODate(filterStart) : defaultStart;
    const end = filterEnd ? parseISODate(filterEnd) : defaultEnd;

    const s = start.getTime() <= end.getTime() ? start : end;
    const e = start.getTime() <= end.getTime() ? end : start;

    // ✅ Single-day -> show work hours slots 09:30–18:30 (30-min)
    if (filterStart && filterEnd && filterStart === filterEnd) {
      return Array.from({ length: slotCount }, (_, i) => {
        const mins = WORK_START_MIN + i * SLOT_MIN;
        const hh = Math.floor(mins / 60);
        const mm = mins % 60;
        return { type: 'work', idx: i, hh, mm } as WorkSlot;
      });
    }

    // ✅ Multi-day -> show days
    const dates: Date[] = [];
    const cur = new Date(s);
    while (cur.getTime() <= e.getTime()) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates.map(d => ({ type: 'day', date: d } as DaySlot));
  }, [filterStart, filterEnd]);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const isToday = (date: Date) => formatDate(date) === formatDate(new Date());

  // Layout: returns left & width in "slot units"
  const getSlotLayout = (startStr: string, endStr: string) => {
    // ✅ Work-hours view (single day)
    if (isSingleDay) {
      const day = parseISODate(filterStart);
      const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);

      const s = parseDateTime(startStr);
      const e = parseDateTime(endStr);

      // clamp to that day
      const cs = new Date(clamp(s.getTime(), dayStart.getTime(), dayEnd.getTime()));
      const ce = new Date(clamp(e.getTime(), dayStart.getTime(), dayEnd.getTime()));

      const sMin = cs.getHours() * 60 + cs.getMinutes();
      const eMin = ce.getHours() * 60 + ce.getMinutes();

      // clamp to work hours 09:30–18:30
      const ws = clamp(sMin, WORK_START_MIN, WORK_END_MIN);
      const we = clamp(eMin, WORK_START_MIN, WORK_END_MIN);

      const left = (ws - WORK_START_MIN) / SLOT_MIN;
      const width = Math.max(0.5, (we - ws) / SLOT_MIN); // min 0.5 slot (15 min)

      return { left, width };
    }

    // ✅ Day view
    const s = new Date(startStr); s.setHours(0, 0, 0, 0);
    const e = new Date(endStr); e.setHours(0, 0, 0, 0);

    const firstDaySlot = timelineSlots.find(x => x.type === 'day') as DaySlot | undefined;
    const startOfTimeline = firstDaySlot?.date ?? new Date();
    startOfTimeline.setHours(0, 0, 0, 0);

    const diffStart = Math.round((s.getTime() - startOfTimeline.getTime()) / (1000 * 60 * 60 * 24));
    const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return { left: diffStart, width: diffDays };
  };

  const filteredTasks = useMemo(() => {
    let tasks = data.tasks;

    if (filterUser) tasks = tasks.filter(t => t.phases.some(p => p.userId === filterUser));
    if (filterTeam) tasks = tasks.filter(t => t.phases.some(p => p.teamId === filterTeam));
    if (filterStatus) tasks = tasks.filter(t => t.phases.some(p => p.status === filterStatus));

    // ✅ Date range filter (phase overlaps selected window)
    if (filterStart || filterEnd) {
      // Single day -> only work hours window
      if (isSingleDay) {
        const day = parseISODate(filterStart);
        const workStart = new Date(day); workStart.setHours(9, 30, 0, 0);
        const workEnd = new Date(day); workEnd.setHours(18, 30, 0, 0);

        tasks = tasks.filter(task =>
          task.phases.some(phase => overlaps(parseDateTime(phase.startDate), parseDateTime(phase.endDate), workStart, workEnd))
        );
      } else {
        // Multi-day -> whole-day overlap
        const start = filterStart ? parseISODate(filterStart) : (() => {
          const first = timelineSlots[0] as DaySlot;
          return first?.type === 'day' ? first.date : parseISODate(toISODate(new Date()));
        })();
        const end = filterEnd ? parseISODate(filterEnd) : (() => {
          const last = timelineSlots[timelineSlots.length - 1] as DaySlot;
          return last?.type === 'day' ? last.date : parseISODate(toISODate(new Date()));
        })();

        tasks = tasks.filter(task =>
          task.phases.some(phase => {
            const ps = parseISODate(toISODate(parseDateTime(phase.startDate)));
            const pe = parseISODate(toISODate(parseDateTime(phase.endDate)));
            return overlaps(ps, pe, start, end);
          })
        );
      }
    }

    return tasks;
  }, [data.tasks, filterUser, filterTeam, filterStatus, filterStart, filterEnd, isSingleDay, timelineSlots]);

  // Check if a phase is overdue
  const isOverdue = (phase: { endDate: string; status: TaskStatus }) => {
    if (phase.status === TaskStatus.DONE) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(phase.endDate);
    due.setHours(0, 0, 0, 0);
    return now > due;
  };

  const colPx = isSingleDay ? workSlotPx : dayColWidth;

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('timeline_title')}</h2>
          <p className="text-slate-500">{t('timeline_desc')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="project">{t('timeline_view_project')}</option>
            <option value="person">{t('timeline_view_person')}</option>
          </select>

          {/* ✅ Date range filters */}
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

            {/* ✅ Quick date filters */}
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
                  const nextWeekStart = startOfWeek(now);
                  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
                  const nextWeekEnd = new Date(nextWeekStart);
                  nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

                  setFilterStart(toISODate(nextWeekStart));
                  setFilterEnd(toISODate(nextWeekEnd));
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
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('timeline_filter_all')}</option>
            {data.users.filter(u => u.status === 'active').map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('timeline_filter_team')}</option>
            {data.departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('timeline_filter_status')}</option>
            {Object.values(TaskStatus).map(s => (
              <option key={s} value={s}>{t(`status.${s}`)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="flex border-b border-slate-100 overflow-x-auto custom-scrollbar">
          <div className="min-w-[200px] border-r border-slate-100 bg-slate-50/50 p-4 sticky left-0 z-20 flex items-center font-bold text-slate-600 text-sm">
            {viewMode === 'project'
              ? (lang === 'en' ? 'Project / Task' : 'โปรเจกต์ / งาน')
              : (lang === 'en' ? 'Employee / Task' : 'พนักงาน / งาน')}
          </div>

          <div className="flex">
            {timelineSlots.map((slot) => {
              if (slot.type === 'day') {
                const date = slot.date;
                const todayFlag = isToday(date);
                return (
                  <div
                    key={date.getTime()}
                    className={`h-16 flex flex-col items-center justify-center border-r border-slate-100 ${todayFlag ? 'bg-blue-50' : ''}`}
                    style={{ minWidth: dayColWidth }}
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {date.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { weekday: 'short' })}
                    </span>
                    <span className={`text-sm font-semibold ${todayFlag ? 'text-blue-600' : 'text-slate-600'}`}>
                      {date.getDate()}
                    </span>
                  </div>
                );
              }

              const label = `${String(slot.hh).padStart(2, '0')}:${String(slot.mm).padStart(2, '0')}`;
              return (
                <div
                  key={`w-${slot.idx}`}
                  className="h-16 flex flex-col items-center justify-center border-r border-slate-100"
                  style={{ minWidth: workSlotPx }}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {lang === 'en' ? 'Time' : 'เวลา'}
                  </span>
                  <span className="text-sm font-semibold text-slate-600">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar relative">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              {lang === 'en' ? 'No tasks found' : 'ไม่พบงานที่ค้นหา'}
            </div>
          ) : (
            filteredTasks.map(task => {
              const project = data.projects.find(p => p.id === task.projectId);
              return (
                <div key={task.id} className="flex border-b border-slate-50 hover:bg-slate-50/30 transition-colors group">
                  <div className="min-w-[200px] max-w-[200px] border-r border-slate-100 bg-white p-4 sticky left-0 z-10">
                    <h4 className="text-sm font-bold text-slate-800 truncate" title={task.title}>{task.title}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      {project?.codename && <span className="text-[9px] font-mono font-bold text-blue-500">[{project.codename}]</span>}
                      <span className="text-[10px] text-slate-400 truncate">{project?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold border ${PRIORITY_COLORS[task.priority || 'medium']}`}>
                        {t(`priority.${task.priority || 'medium'}`)}
                      </span>
                    </div>
                    <button
                      onClick={() => onEditTask(task)}
                      className="mt-2 text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Icons.Edit className="w-3 h-3" /> {lang === 'en' ? 'Edit Task' : 'แก้ไขงาน'}
                    </button>
                  </div>

                  <div className="flex relative h-20 items-center">
                    {/* grid */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {timelineSlots.map((slot) => (
                        <div
                          key={`grid-${slot.type}-${slot.type === 'day' ? slot.date.getTime() : slot.idx}`}
                          className="h-full border-r border-slate-50"
                          style={{ minWidth: slot.type === 'day' ? dayColWidth : workSlotPx }}
                        />
                      ))}
                    </div>

                    {task.phases.map((phase, idx) => {
                      const { left: leftPos, width } = getSlotLayout(phase.startDate, phase.endDate);

                      const totalSlots = timelineSlots.length;
                      const clampedLeft = Math.max(0, leftPos);
                      const clampedRight = Math.min(totalSlots, leftPos + width);
                      const clampedWidth = Math.max(0.5, clampedRight - clampedLeft);

                      if (clampedRight <= 0 || clampedLeft >= totalSlots) return null;

                      const user = data.users.find(u => u.id === phase.userId);
                      const dept = data.departments.find(d => d.id === phase.teamId);
                      const overdue = isOverdue(phase);

                      return (
                        <div
                          key={phase.id}
                          className={`absolute rounded-lg flex items-center px-2 text-[10px] font-semibold shadow-sm border truncate cursor-pointer hover:brightness-95 transition
                            ${overdue ? 'bg-red-100 text-red-700 border-red-300 ring-1 ring-red-200' : STATUS_COLORS[phase.status] || 'bg-slate-100'}`}
                          style={{
                            left: `${clampedLeft * colPx + 6}px`,
                            width: `${clampedWidth * colPx - 12}px`,
                            top: `${topPad + idx * laneHeight}px`,
                            height: `${barHeight}px`,
                          }}
                          onClick={() => onEditTask(task)}
                          title={`${dept?.name ?? ''}: ${user?.name ?? ''} (${t(`status.${phase.status}`)})${overdue ? ' ⚠ OVERDUE' : ''}`}
                        >
                          <div className="flex flex-col leading-tight">
                            <span className="truncate">{dept?.name}: {user?.name}</span>
                            <span className="opacity-70 font-normal truncate">
                              {t(`status.${phase.status}`)}
                              {overdue && ' ⚠'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
