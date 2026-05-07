import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Coins, 
  Settings, 
  Search, 
  Bell, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react';

/**
 * SummaryCard Component
 * Implements the 2px gold top-border and subtle shadow requested.
 */
const SummaryCard = ({ title, value, icon: Icon }) => (
  <div className="bg-white rounded-xl shadow-sm border-t-2 border-[#BF953F] p-6 flex items-center justify-between transition-all hover:shadow-md">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
    </div>
    <div className="bg-[#8A0332]/5 p-3 rounded-lg">
      <Icon className="size-6 text-[#8A0332]" />
    </div>
  </div>
);

/**
 * NavItem Component
 * Implements the gold gradient for active states and burgundy/white sidebar styling.
 */
const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
      active 
        ? 'bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-[#8A0332] font-bold shadow-lg' 
        : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`}
  >
    <Icon className={`size-5 ${active ? 'text-[#8A0332]' : 'text-white/60 group-hover:text-white'}`} />
    <span className="text-sm tracking-wide">{label}</span>
    {active && <ChevronRight className="ml-auto size-4" />}
  </button>
);

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Members', icon: Users },
    { label: 'Events', icon: Calendar },
    { label: 'Giving', icon: Coins },
    { label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* --- SIDEBAR --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#8A0332] text-white transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo Area: Beautifully padded for the logo.png */}
          <div className="p-8 flex flex-col items-center border-b border-white/10">
            <div className="bg-white p-4 rounded-2xl shadow-xl mb-4 group hover:rotate-2 transition-transform duration-500">
               {/* Note: Using standard Vite syntax as requested */}
               <img src="/logo.png" alt="Church Logo" className="w-20 h-20 object-contain" />
            </div>
            <h1 className="text-xs font-black tracking-[0.3em] uppercase text-[#FCF6BA] text-center">
              RTCI Portal
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-2">
            {navItems.map((item) => (
              <NavItem 
                key={item.label}
                icon={item.icon}
                label={item.label}
                active={activeTab === item.label}
                onClick={() => setActiveTab(item.label)}
              />
            ))}
          </nav>

          {/* User Preview */}
          <div className="p-4 border-t border-white/10 bg-black/10">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-gradient-to-r from-[#BF953F] to-[#B38728] flex items-center justify-center font-bold text-[#8A0332] text-xs border border-white/20">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">Rev. John Doe</p>
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-black">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        
        {/* Top Bar: Clean white header with subtle bottom border */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden md:block">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Search registry..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#8A0332]/20 w-64 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-[#8A0332] transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <div className="size-10 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden cursor-pointer hover:border-[#8A0332] transition-all">
              <img src="https://ui-avatars.com/api/?name=Admin&background=8A0332&color=fff" alt="User" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 md:p-8 flex-1">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Breadcrumb & Header */}
            <div>
              <p className="text-xs font-black text-[#8A0332] uppercase tracking-[0.2em] mb-1">Redeemed Transformation Chapel</p>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{activeTab} Overview</h2>
            </div>

            {/* Dashboard Grid: 4 Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SummaryCard title="Total Members" value="2,482" icon={Users} />
              <SummaryCard title="Weekly Attendance" value="1,120" icon={LayoutDashboard} />
              <SummaryCard title="Monthly Giving" value="$12,450" icon={Coins} />
              <SummaryCard title="Active Ministries" value="18" icon={Calendar} />
            </div>

            {/* Placeholder for Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 h-96 flex flex-col items-center justify-center text-slate-400">
                <LayoutDashboard size={48} className="mb-4 opacity-20" />
                <p className="font-medium">Recent Activity & Growth Chart Placeholder</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 h-96 flex flex-col items-center justify-center text-slate-400">
                <Bell size={48} className="mb-4 opacity-20" />
                <p className="font-medium text-center">Notifications & Tasks Feed</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {!sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(true)}></div>
      )}
    </div>
  );
};

export default DashboardLayout;
