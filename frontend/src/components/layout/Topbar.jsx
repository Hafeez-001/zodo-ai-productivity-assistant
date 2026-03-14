import React, { useState } from 'react';
import { Search, Bell, Menu, User, Settings, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { Input, Avatar, Button } from '../ui';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

export default function Topbar({ onToggleSidebar }) {
  const { user, logoutUser } = useAuth();
  const { showToast } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-10 transition-colors duration-300">
      <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-xl">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search anything... (Coming Soon)" 
            className="pl-10 h-9 bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 border-none focus:bg-white dark:focus:bg-gray-700 focus:ring-1 focus:ring-blue-500/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter') showToast("Global search is coming in the next update!", "info");
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-xl text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all active:scale-95"
          onClick={() => showToast("You have no new notifications.", "info")}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
        </Button>
        
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-700 pl-4 cursor-pointer group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{user.username}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider font-bold">Productivity Master</p>
            </div>
            <Avatar name={user.username} size="md" className="ring-2 ring-gray-100 dark:ring-gray-700 ring-offset-2 group-hover:ring-blue-100 dark:group-hover:ring-blue-900 transition-all" />
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-200", showDropdown && "rotate-180")} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <button 
                onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <User className="w-4 h-4" />Profile
              </button>
              <button 
                onClick={() => { setShowDropdown(false); showToast("Settings dashboard is under construction.", "info"); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings className="w-4 h-4" />Settings
              </button>
              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
              <button 
                onClick={logoutUser}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
