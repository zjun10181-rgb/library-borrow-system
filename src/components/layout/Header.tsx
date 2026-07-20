import { Library, User, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-divider sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:ml-64">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-cream rounded-lg md:hidden"
            >
              <Menu className="w-6 h-6 text-ink" />
            </button>
            <div className="flex items-center space-x-2" onClick={() => navigate('/')}>
              <Library className="w-8 h-8 text-primary-500" />
              <h1 className="text-xl font-serif font-semibold text-ink hidden sm:block">
                图书馆管理系统
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{user.name}</p>
                      <p className="text-xs text-muted">{user.role === 'admin' ? '管理员' : user.role === 'teacher' ? '教师' : user.role === 'parent' ? '家长' : '学生'}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="ml-2"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    退出登录
                  </Button>
                </div>
                <div className="sm:hidden">
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}