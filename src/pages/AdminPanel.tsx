import { useState, useEffect } from 'react';
import { Users, BookOpen, RotateCcw, Search, Check, X, Plus, Lock, UserPlus, Settings } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { getUsers, getBooks, getBorrowRecords, approveUser, deleteUser, deleteBook, insertUser, updatePassword, updateUserRole, resetPassword } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';
import type { User, Book } from '@/types';

interface BorrowRecordWithBook {
  id: string;
  books: {
    title: string;
    author: string;
    id: string;
  };
  users: {
    name: string;
    id: string;
  };
  borrow_date: string;
  due_date: string;
  return_date?: string | null;
  status: string;
}

type TabType = 'users' | 'books' | 'borrows' | 'create-user' | 'change-password';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecordWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' as User['role'] });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [resetPasswordNewPassword, setResetPasswordNewPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const { data } = await getUsers();
        setUsers(data || []);
      } else if (activeTab === 'books') {
        const { data } = await getBooks();
        setBooks(data || []);
      } else if (activeTab === 'borrows') {
        const { data } = await getBorrowRecords();
        setBorrows(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await approveUser(userId);
      fetchData();
    } catch (error) {
      console.error('Failed to approve user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除该用户吗？')) return;
    try {
      await deleteUser(userId);
      fetchData();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || !resetPasswordNewPassword) {
      setMessage('请选择用户并输入新密码');
      setMessageType('error');
      return;
    }
    if (resetPasswordNewPassword !== resetPasswordConfirm) {
      setMessage('两次输入的密码不一致');
      setMessageType('error');
      return;
    }
    const user = users.find(u => u.id === resetPasswordUserId);
    if (!user) {
      setMessage('用户不存在');
      setMessageType('error');
      return;
    }
    try {
      const { error } = await resetPassword(user.email, resetPasswordNewPassword);
      if (error) {
        setMessage(error.message);
        setMessageType('error');
      } else {
        setMessage('密码重置成功');
        setMessageType('success');
        setResetPasswordUserId(null);
        setResetPasswordNewPassword('');
        setResetPasswordConfirm('');
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
      setMessage('重置密码失败');
      setMessageType('error');
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('确定要删除该图书吗？')) return;
    try {
      await deleteBook(bookId);
      fetchData();
    } catch (error) {
      console.error('Failed to delete book:', error);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setMessage('请填写所有字段');
      setMessageType('error');
      return;
    }
    try {
      const userData = { id: `user_${Date.now()}`, email: newUser.email, name: newUser.name, role: newUser.role };
      await insertUser(userData);
      const mockPasswords: Record<string, string> = {};
      mockPasswords[newUser.email] = newUser.password;
      localStorage.setItem('library_passwords', JSON.stringify({ ...JSON.parse(localStorage.getItem('library_passwords') || '{}'), ...mockPasswords }));
      setMessage('用户创建成功');
      setMessageType('success');
      setNewUser({ name: '', email: '', password: '', role: 'student' });
      fetchData();
    } catch (error) {
      setMessage('用户创建失败');
      setMessageType('error');
    }
  };

  const handleUpdateUserRole = async (userId: string, role: User['role']) => {
    try {
      await updateUserRole(userId, role);
      fetchData();
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const handleChangePassword = async () => {
    const { oldPassword, newPassword, confirmPassword } = passwordForm;
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage('请填写所有字段');
      setMessageType('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('新密码和确认密码不一致');
      setMessageType('error');
      return;
    }
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        setMessage('请先登录');
        setMessageType('error');
        return;
      }
      const { error } = await updatePassword(currentUser.email, oldPassword, newPassword);
      if (error) {
        setMessage(error.message);
        setMessageType('error');
      } else {
        setMessage('密码修改成功');
        setMessageType('success');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      setMessage('密码修改失败');
      setMessageType('error');
    }
  };

  const tabs = [
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'books', label: '图书管理', icon: BookOpen },
    { id: 'borrows', label: '借阅记录', icon: RotateCcw },
    { id: 'create-user', label: '创建用户', icon: UserPlus },
    { id: 'change-password', label: '修改密码', icon: Lock },
  ];

  const renderUsers = () => (
    <div className="space-y-4">
      {users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted">暂无用户</p>
        </div>
      ) : (
        users.map((user) => {
          const filtered = !searchTerm || 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
          
          if (!filtered) return null;

          return (
            <Card key={user.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-primary-600">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-ink">{user.name}</h3>
                  <p className="text-sm text-muted">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={user.role === 'admin' ? 'danger' : 'secondary'}>
                      {user.role === 'admin' ? '管理员' : user.role === 'teacher' ? '教师' : user.role === 'parent' ? '家长' : '学生'}
                    </Badge>
                    {!user.approved && (
                      <Badge variant="warning">待审核</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!user.approved && (
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={() => handleApproveUser(user.id)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    审核通过
                  </Button>
                )}
                <select
                  value={user.role}
                  onChange={(e) => handleUpdateUserRole(user.id, e.target.value as User['role'])}
                  className="px-3 py-1.5 text-sm border border-divider rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="student">学生</option>
                  <option value="teacher">教师</option>
                  <option value="parent">家长</option>
                  <option value="admin">管理员</option>
                </select>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setResetPasswordUserId(user.id);
                    setResetPasswordNewPassword('');
                    setResetPasswordConfirm('');
                  }}
                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                >
                  <Lock className="w-4 h-4" />
                  重置密码
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteUser(user.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );

  if (resetPasswordUserId) {
    const selectedUser = users.find(u => u.id === resetPasswordUserId);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <h2 className="text-xl font-semibold text-ink mb-6 flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            重置用户密码
          </h2>
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}
          <div className="mb-4">
            <p className="text-sm text-muted">为用户 <strong>{selectedUser?.name}</strong> 重置密码</p>
          </div>
          <div className="space-y-4">
            <Input
              label="新密码"
              type="password"
              value={resetPasswordNewPassword}
              onChange={(e) => setResetPasswordNewPassword(e.target.value)}
              placeholder="请输入新密码"
            />
            <Input
              label="确认密码"
              type="password"
              value={resetPasswordConfirm}
              onChange={(e) => setResetPasswordConfirm(e.target.value)}
              placeholder="请再次输入新密码"
            />
          </div>
          <div className="flex space-x-3 mt-6">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setResetPasswordUserId(null);
                setResetPasswordNewPassword('');
                setResetPasswordConfirm('');
              }}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleResetPassword}>
              确认重置
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const renderCreateUser = () => (
    <Card className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-ink mb-6 flex items-center">
        <UserPlus className="w-5 h-5 mr-2" />
        创建新用户
      </h2>
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">用户名</label>
          <Input
            type="text"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            placeholder="请输入用户名"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">邮箱</label>
          <Input
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="请输入邮箱"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">密码</label>
          <Input
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            placeholder="请输入密码"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">角色</label>
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as User['role'] })}
            className="w-full px-4 py-2 border border-divider rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="student">学生</option>
            <option value="teacher">教师</option>
            <option value="parent">家长</option>
            <option value="admin">管理员</option>
          </select>
        </div>
        <Button onClick={handleCreateUser} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          创建用户
        </Button>
      </div>
    </Card>
  );

  const renderChangePassword = () => (
    <Card className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-ink mb-6 flex items-center">
        <Lock className="w-5 h-5 mr-2" />
        修改密码
      </h2>
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">旧密码</label>
          <Input
            type="password"
            value={passwordForm.oldPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
            placeholder="请输入旧密码"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">新密码</label>
          <Input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            placeholder="请输入新密码"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">确认新密码</label>
          <Input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            placeholder="请再次输入新密码"
          />
        </div>
        <Button onClick={handleChangePassword} className="w-full">
          <Lock className="w-4 h-4 mr-2" />
          修改密码
        </Button>
      </div>
    </Card>
  );

  const renderBooks = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {books.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <BookOpen className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted">暂无图书</p>
        </div>
      ) : (
        books.map((book) => {
          const filtered = !searchTerm || 
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase());
          
          if (!filtered) return null;

          return (
            <Card key={book.id} className="relative">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-20 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-8 h-8 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ink truncate">{book.title}</h3>
                  <p className="text-sm text-muted truncate">{book.author}</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <Badge variant="secondary">{book.category || '未分类'}</Badge>
                    <span className="text-xs text-muted">库存: {book.available_copies}/{book.total_copies}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-divider">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteBook(book.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                  删除
                </Button>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );

  const renderBorrows = () => (
    <div className="space-y-4">
      {borrows.length === 0 ? (
        <div className="text-center py-12">
          <RotateCcw className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted">暂无借阅记录</p>
        </div>
      ) : (
        borrows.map((record) => {
          const filtered = !searchTerm || 
            record.books.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.users.name.toLowerCase().includes(searchTerm.toLowerCase());
          
          if (!filtered) return null;

          return (
            <Card key={record.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink">{record.books.title}</h3>
                  <p className="text-sm text-muted">{record.books.author}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-muted">借阅人: {record.users.name}</span>
                    <span className="text-xs text-muted">借阅: {record.borrow_date}</span>
                    {record.return_date && (
                      <span className="text-xs text-muted">归还: {record.return_date}</span>
                    )}
                  </div>
                </div>
              </div>
              <Badge variant={record.status === 'returned' ? 'success' : 'primary'}>
                {record.status === 'returned' ? '已归还' : '借阅中'}
              </Badge>
            </Card>
          );
        })
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">管理后台</h1>
        <p className="text-muted mt-1">管理图书馆的用户、图书和借阅记录</p>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as TabType);
              setSearchTerm('');
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white shadow-sm text-primary-600'
                : 'text-muted hover:text-ink'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-divider">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <Input
            type="text"
            placeholder={`搜索${tabs.find(t => t.id === activeTab)?.label.replace('管理', '')}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : activeTab === 'users' ? (
        renderUsers()
      ) : activeTab === 'books' ? (
        renderBooks()
      ) : activeTab === 'borrows' ? (
        renderBorrows()
      ) : activeTab === 'create-user' ? (
        renderCreateUser()
      ) : (
        renderChangePassword()
      )}
    </div>
  );
}