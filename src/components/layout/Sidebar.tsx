import { 
  LayoutDashboard, 
  BookOpen, 
  BookCopy, 
  ClipboardList, 
  Users, 
  BarChart3,
  Home,
  X,
  FolderOpen
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLocation, useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  requireAdmin?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: '首页', path: '/' },
  { icon: LayoutDashboard, label: '仪表盘', path: '/dashboard' },
  { icon: BookOpen, label: '图书管理', path: '/library' },
  { icon: FolderOpen, label: '家庭图书', path: '/family-library' },
  { icon: ClipboardList, label: '我的借阅', path: '/my-borrowing' },
  { icon: Users, label: '管理后台', path: '/admin', requireAdmin: true },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { isAdmin, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-divider z-50 transform transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-divider">
          <h2 className="text-lg font-serif font-semibold text-ink">导航菜单</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cream rounded-lg md:hidden"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            if (item.requireAdmin && !isAdmin()) return null;
            
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600 font-semibold' 
                    : 'text-ink hover:bg-cream hover:text-primary-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-divider">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <BookCopy className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{user.name}</p>
                <p className="text-xs text-muted">{user.role === 'admin' ? '管理员' : user.role === 'teacher' ? '教师' : user.role === 'parent' ? '家长' : '学生'}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}