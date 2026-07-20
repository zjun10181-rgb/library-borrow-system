import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Library, Mail, Lock, User, GraduationCap, Briefcase } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { signUp, insertUser } from '@/utils/supabase';
import type { UserRole } from '@/types';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await signUp(email, password, name, role);

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('该邮箱已被注册');
        } else {
          setError('注册失败，请重试');
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        await insertUser({
          id: data.user.id,
          email,
          name,
          role,
        });

        setSuccess(true);
        setLoading(false);

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError('注册失败，请重试');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-ink mb-2">注册成功</h2>
            <p className="text-muted">您的账号已提交审核，请等待管理员批准后登录</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Library className="w-8 h-8 text-secondary-500" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-ink">注册账号</h1>
            <p className="text-muted mt-2">创建您的图书馆系统账号</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="姓名"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入您的姓名"
              required
            />

            <Input
              label="邮箱"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱地址"
              required
            />

            <Input
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码（至少6位）"
              required
            />

            <Input
              label="确认密码"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              required
            />

            <Select label="角色" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="student">学生</option>
              <option value="teacher">教师</option>
              <option value="parent">家长</option>
            </Select>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted">
                已有账号？{' '}
                <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">
                  立即登录
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}