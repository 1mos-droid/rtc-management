import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Baby, 
  Send, 
  UserCheck, 
  Coins, 
  Calendar, 
  MessageSquare, 
  BookOpen, 
  Book, 
  Image as ImageIcon, 
  ShieldCheck, 
  BarChart3, 
  Zap, 
  Network, 
  Terminal, 
  HelpCircle, 
  Settings 
} from 'lucide-react';

export const NAV_ITEMS = [
  { text: 'Dashboard', path: '/', icon: LayoutDashboard },
  { text: 'Members', path: '/members', icon: Users },
  { text: 'Groups', path: '/groups', icon: Layers },
  { text: 'Children', path: '/children', icon: Baby },
  { text: 'Communication', path: '/messaging', icon: Send },
  { text: 'Attendance', path: '/attendance', icon: UserCheck },
  { text: 'Financials', path: '/financials', icon: Coins },
  { text: 'Events', path: '/events', icon: Calendar },
  { text: 'Prayer Requests', path: '/prayer-requests', icon: MessageSquare },
  { text: 'Library', path: '/bible-studies', icon: BookOpen },
  { text: 'Live Bible', path: '/live-bible', icon: Book },
  { text: 'Service Gallery', path: '/gallery', icon: ImageIcon },
  { text: 'Church Leadership', path: '/leadership', icon: ShieldCheck },
];

export const ADMIN_ITEMS = [
  { text: 'User Management', path: '/user-management', icon: ShieldCheck },
  { text: 'Reports', path: '/reports', icon: BarChart3 },
  { text: 'Quick Switch', path: '/quick-switch', icon: Zap },
  { text: 'Data Graph', path: '/graph', icon: Network },
];

export const DEV_ITEMS = [
  { text: 'Developer Console', path: '/developer', icon: Terminal },
];

export const UTILITY_ITEMS = [
  { text: 'Help & Docs', path: '/help', icon: HelpCircle },
  { text: 'Settings', path: '/settings', icon: Settings },
];

export const getSections = (user, ROLES, isAdmin, isDeveloper, mimicRole) => {
  const effectiveRoleValue = mimicRole || user?.role;
  
  if (effectiveRoleValue === ROLES.MEMBER) {
    return [
      { label: 'Main Menu', items: [
        { text: 'Dashboard', path: '/', icon: LayoutDashboard },
        { text: 'Events', path: '/events', icon: Calendar },
        { text: 'Prayer Requests', path: '/prayer-requests', icon: MessageSquare },
        { text: 'Library', path: '/bible-studies', icon: BookOpen },
        { text: 'Live Bible', path: '/live-bible', icon: Book },
        { text: 'Service Gallery', path: '/gallery', icon: ImageIcon },
        { text: 'Church Leadership', path: '/leadership', icon: ShieldCheck },
      ]},
      { label: 'Support', items: UTILITY_ITEMS }
    ];
  }

  const result = [
    { label: 'Main Menu', items: NAV_ITEMS }
  ];

  if (isAdmin || isDeveloper) {
    result.push({ label: 'Administration', items: ADMIN_ITEMS });
  }

  if (isDeveloper) {
    result.push({ label: 'System', items: DEV_ITEMS });
  }

  result.push({ label: 'Support', items: UTILITY_ITEMS });

  return result;
};
