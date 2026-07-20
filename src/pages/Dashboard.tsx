import { useState, useEffect } from 'react';
import { BookOpen, Users, RotateCcw, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { getBooks, getUsers, getBorrowRecords } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';
import type { BorrowRecordWithBook } from '@/types';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    totalUsers: 0,
    activeBorrows: 0,
    overdueCount: 0,
  });
  const [recentBorrows, setRecentBorrows] = useState<BorrowRecordWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { isAdmin } = useAuthStore();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [{ data: booksData }, { data: usersData }, { data: borrowsData }] = await Promise.all([
        getBooks(),
        getUsers(),
        getBorrowRecords(),
      ]);

      const books = booksData || [];
      const users = usersData || [];
      const borrows = borrowsData || [];

      const totalBooks = books.reduce((sum, book) => sum + book.total_copies, 0);
      const availableBooks = books.reduce((sum, book) => sum + book.available_copies, 0);
      const totalUsers = users.filter(u => u.approved).length;
      const activeBorrows = borrows.filter(b => b.status === 'borrowed').length;
      
      const overdueCount = borrows.filter((b: BorrowRecordWithBook) => {
        if (b.status !== 'borrowed') return false;
        const due = new Date(b.due_date);
        const today = new Date();
        return due < today;
      }).length;

      setStats({ totalBooks, availableBooks, totalUsers, activeBorrows, overdueCount });
      setRecentBorrows(borrows.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
    setLoading(false);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">图书馆仪表盘</h1>
        <p className="text-muted mt-1">欢迎回来，查看最新的图书馆数据</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">图书总数</p>
              <p className="text-2xl font-bold text-ink mt-1">{stats.totalBooks}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">可借图书</p>
              <p className="text-2xl font-bold text-ink mt-1">{stats.availableBooks}</p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-secondary-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">注册用户</p>
              <p className="text-2xl font-bold text-ink mt-1">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">正在借阅</p>
              <p className="text-2xl font-bold text-ink mt-1">{stats.activeBorrows}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">逾期未还</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{stats.overdueCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink">近期借阅记录</h3>
            {isAdmin() && (
              <button className="text-sm text-primary-600 hover:text-primary-700">查看全部</button>
            )}
          </div>
          {recentBorrows.length === 0 ? (
            <p className="text-muted text-center py-8">暂无借阅记录</p>
          ) : (
            <div className="space-y-3">
              {recentBorrows.map((record, index) => {
                const daysUntilDue = getDaysUntilDue(record.due_date);
                const isOverdue = daysUntilDue < 0;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-ink">{record.books.title}</p>
                      <p className="text-sm text-muted">
                        {record.books.author} · {record.users.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${isOverdue ? 'text-red-500' : 'text-ink'}`}>
                        {record.due_date}
                      </p>
                      {isOverdue ? (
                        <Badge variant="danger" className="mt-1">逾期</Badge>
                      ) : (
                        <Badge variant="success" className="mt-1">借阅中</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink">借阅趋势</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: '本周借阅', value: 12, change: '+25%', positive: true },
              { label: '本月借阅', value: 48, change: '+18%', positive: true },
              { label: '年度借阅', value: 520, change: '+12%', positive: true },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">{item.label}</p>
                  <p className="text-xl font-bold text-ink">{item.value}</p>
                </div>
                <div className={`flex items-center space-x-1 ${item.positive ? 'text-green-500' : 'text-red-500'}`}>
                  {item.positive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{item.change}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}