import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, User } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Card } from '@/components/common/Card';
import { getBookById, getUsers, createBorrowRecord, updateBook } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Book, User as UserType } from '@/types';

export function BorrowForm() {
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get('bookId') || '';
  
  const [book, setBook] = useState<Book | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [bookId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: bookData }, { data: usersData }] = await Promise.all([
        bookId ? getBookById(bookId) : Promise.resolve({ data: null }),
        getUsers(),
      ]);
      setBook(bookData || null);
      setUsers(usersData || []);
      
      const defaultUser = usersData?.find(u => u.id === user?.id);
      if (defaultUser) {
        setSelectedUserId(defaultUser.id);
      }
      
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      setDueDate(defaultDueDate.toISOString().split('T')[0]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!book || !selectedUserId || !dueDate) {
      setError('请填写完整信息');
      return;
    }

    if (book.available_copies <= 0) {
      setError('该图书当前无可借库存');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (dueDate <= today) {
      setError('归还日期必须在今天之后');
      return;
    }

    setSubmitting(true);

    try {
      await createBorrowRecord({
        book_id: book.id,
        user_id: selectedUserId,
        borrow_date: today,
        due_date: dueDate,
        status: 'borrowed',
      });

      await updateBook(book.id, {
        available_copies: book.available_copies - 1,
      });

      navigate('/my-borrowing');
    } catch (err) {
      setError('借阅失败，请重试');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/library')}>
          <ArrowLeft className="w-5 h-5 mr-1" />
          返回
        </Button>
        <h2 className="text-2xl font-serif font-bold text-ink">借阅图书</h2>
      </div>

      <Card>
        {book ? (
          <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-divider">
            <div className="w-16 h-20 bg-primary-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary-400" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-ink text-lg">{book.title}</h3>
              <p className="text-muted">{book.author}</p>
              <p className="text-sm text-secondary-600 mt-1">可借库存: {book.available_copies} 本</p>
            </div>
          </div>
        ) : (
          <div className="mb-6 pb-6 border-b border-divider">
            <Input
              label="选择图书"
              type="text"
              value={bookId}
              onChange={(e) => navigate(`/library/borrow?bookId=${e.target.value}`)}
              placeholder="请输入图书ID或从图书列表选择"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">借阅人</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <Select 
                value={selectedUserId} 
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="pl-12"
              >
                <option value="">请选择借阅人</option>
                {users.filter(u => u.approved).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role === 'admin' ? '管理员' : user.role === 'teacher' ? '教师' : user.role === 'parent' ? '家长' : '学生'})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">归还日期</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="pl-12"
              />
            </div>
            <p className="text-xs text-muted mt-1">默认为30天后</p>
          </div>

          {error && (
            <p className="text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/library')}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              <BookOpen className="w-5 h-5 mr-2" />
              {submitting ? '处理中...' : '确认借阅'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}