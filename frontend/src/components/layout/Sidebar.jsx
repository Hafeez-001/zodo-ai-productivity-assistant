import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  BarChart3, 
  User, 
  LogOut,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar, Button } from '../ui';
import { useAuth } from '../../hooks/useAuth';

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer",
      isActive 
        ? "bg-blue-600 text-white shadow-sm" 
        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
    )}
  >
    <Icon className={cn("w-4 h-4", "group-hover:scale-110 transition-transform")} />
    {label}
  </NavLink>
);

const Sidebar = ({ onClose }) => {
  const { user, logoutUser } = useAuth();

  return (
    <aside className="w-64 h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col p-4 shrink-0 shadow-xl lg:shadow-none transition-colors duration-300">
      <div className="flex items-center justify-between px-4 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Zodo</span>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
        <SidebarItem to="/tasks" icon={CheckSquare} label="Tasks" />
        <SidebarItem to="/calendar" icon={CalendarDays} label="Calendar" />
        <SidebarItem to="/notes" icon={FileText} label="Notes" />
        <SidebarItem to="/insights" icon={BarChart3} label="Analytics" />
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
        <SidebarItem to="/profile" icon={User} label="Profile" />
        <button
          onClick={logoutUser}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 group cursor-pointer"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          Logout
        </button>
        
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Avatar name={user?.username} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.username}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user?.email || 'Free Plan'}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
