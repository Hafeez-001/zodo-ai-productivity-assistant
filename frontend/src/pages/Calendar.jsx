import React, { useState, useEffect, useMemo } from 'react';
import { getTasks } from '../services/api';
import { Card } from '../components/ui';
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const PRIORITY_COLORS = {
  Critical: 'bg-red-500 text-white',
  High: 'bg-amber-500 text-white',
  Medium: 'bg-blue-500 text-white',
  Low: 'bg-gray-400 text-white',
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function Calendar() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('monthly'); // 'weekly' | 'monthly'
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    getTasks().then(setTasks).catch(console.error);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Group tasks by date string "YYYY-MM-DD"
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (t.deadline) {
        const key = new Date(t.deadline).toISOString().split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [tasks]);

  function prevPeriod() {
    const d = new Date(currentDate);
    if (view === 'monthly') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  }

  function nextPeriod() {
    const d = new Date(currentDate);
    if (view === 'monthly') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  }

  function goToday() { setCurrentDate(new Date()); }

  function TaskBadge({ task }) {
    return (
      <div
        className={cn(
          'text-[10px] font-bold px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity',
          PRIORITY_COLORS[task.priorityLabel] || PRIORITY_COLORS.Medium
        )}
        title={`${task.title} — ${task.priorityLabel}`}
        onClick={() => navigate('/tasks')}
      >
        {task.title}
      </div>
    );
  }

  function DayCell({ dateStr, dayNum, isToday, isCurrentMonth = true }) {
    const dayTasks = tasksByDate[dateStr] || [];
    return (
      <div className={cn(
        'min-h-[90px] p-2 rounded-xl border transition-colors',
        isToday
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
          : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50',
        !isCurrentMonth && 'opacity-40'
      )}>
        <span className={cn(
          'text-xs font-bold block mb-1',
          isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
        )}>
          {dayNum}
        </span>
        <div className="space-y-0.5">
          {dayTasks.slice(0, 3).map(t => <TaskBadge key={t._id} task={t} />)}
          {dayTasks.length > 3 && (
            <p className="text-[9px] text-gray-400 font-bold pl-1">+{dayTasks.length - 3} more</p>
          )}
        </div>
      </div>
    );
  }

  // Monthly view
  function MonthlyGrid() {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();

    const cells = [];
    // Padding before first day
    for (let i = 0; i < firstDay; i++) {
      const prevMonthDays = getDaysInMonth(year, month - 1);
      const d = prevMonthDays - firstDay + 1 + i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push(<DayCell key={`prev-${i}`} dateStr={dateStr} dayNum={d} isToday={false} isCurrentMonth={false} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
      cells.push(<DayCell key={d} dateStr={dateStr} dayNum={d} isToday={isToday} />);
    }

    // Padding after last day
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push(<DayCell key={`next-${i}`} dateStr={dateStr} dayNum={i} isToday={false} isCurrentMonth={false} />);
    }

    return (
      <div>
        <div className="grid grid-cols-7 mb-2">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">{cells}</div>
      </div>
    );
  }

  // Weekly view
  function WeeklyGrid() {
    const today = new Date();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const cells = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = d.toDateString() === today.toDateString();
      cells.push(
        <div key={i} className="flex flex-col">
          <div className={cn(
            "text-center text-[10px] font-black uppercase tracking-widest py-2 mb-1",
            isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
          )}>
            {DAYS_SHORT[d.getDay()]} <span className="block text-base font-black">{d.getDate()}</span>
          </div>
          <DayCell dateStr={dateStr} dayNum={''} isToday={isToday} />
        </div>
      );
    }

    return <div className="grid grid-cols-7 gap-1.5">{cells}</div>;
  }

  const title = view === 'monthly'
    ? `${MONTHS[month]} ${year}`
    : (() => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - d.getDay());
        const end = new Date(d); end.setDate(end.getDate() + 6);
        return `${d.getDate()} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
      })();

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Visualize your tasks and deadlines.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setView('weekly')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all",
                view === 'weekly' ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm" : "text-gray-500 dark:text-gray-400"
              )}
            >
              <CalendarDays className="w-4 h-4" /> Week
            </button>
            <button
              onClick={() => setView('monthly')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all",
                view === 'monthly' ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm" : "text-gray-500 dark:text-gray-400"
              )}
            >
              <LayoutGrid className="w-4 h-4" /> Month
            </button>
          </div>
        </div>
      </div>

      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        {/* Header nav */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToday}
              className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
            >Today</button>
            <button onClick={prevPeriod} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextPeriod} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {view === 'monthly' ? <MonthlyGrid /> : <WeeklyGrid />}
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 px-1 flex-wrap">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Priority:</p>
        {Object.entries(PRIORITY_COLORS).map(([label, cls]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-sm", cls.split(' ')[0])} />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
