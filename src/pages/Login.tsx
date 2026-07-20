import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Library, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { login, getUserByEmail } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setUser, setLoading: setAuthLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await login(email, password);
      
      if (authError) {
        setError('邮箱或密码错误');
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: userData, error: userError } = await getUserByEmail(email);
        
        if (userError || !userData) {
          setError('用户信息获取失败');
          setLoading(false);
          return;
        }

        if (!userData.approved) {
          setError('您的账号尚未被管理员批准，请等待审核');
          setLoading(false);
          return;
        }

        setUser(userData);
        setAuthLoading(false);
        navigate('/');
      }
    } catch (err) {
      setError('登录失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Library className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-ink">图书馆管理系统</h1>
            <p className="text-muted mt-2">欢迎登录，开始您的阅读之旅</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="邮箱"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱地址"
              error={error}
              icon={<Mail className="w-5 h-5" />}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className={`w-full px-4 py-2.5 pr-12 border border-divider rounded-lg bg-white text-ink placeholder:text-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 ${error ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary-500"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>

            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted">
                还没有账号？{' '}
                <Link to="/register" className="text-primary-500 hover:text-primary-600 font-medium">
                  立即注册
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}