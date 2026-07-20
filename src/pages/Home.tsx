import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Clock, Search, ArrowRight, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { getBooks, getBorrowRecords } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Book, BorrowRecordWithBook } from '@/types';

export function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [recentBorrows, setRecentBorrows] = useState<BorrowRecordWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: booksData }, { data: borrowsData }] = await Promise.all([
        getBooks(),
        getBorrowRecords(user?.id),
      ]);
      setBooks(booksData?.slice(0, 4) || []);
      setRecentBorrows(borrowsData?.filter((b: BorrowRecordWithBook) => b.status === 'borrowed').slice(0, 3) || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-serif font-bold">欢迎回到图书馆</h1>
        <p className="text-primary-100 mt-2">
          {user ? `你好，${user.name}！` : '探索精彩的图书世界'}
        </p>
        <div className="flex flex-wrap gap-4 mt-6">
          <Button 
            variant="light" 
            onClick={() => navigate('/library')}
            className="bg-white text-primary-600 hover:bg-primary-50"
          >
            <Search className="w-5 h-5 mr-2" />
            浏览图书
          </Button>
          {user && (
            <>
              <Button 
                variant="light" 
                onClick={() => navigate('/my-borrowing')}
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                <Calendar className="w-5 h-5 mr-2" />
                我的借阅
              </Button>
              <Button 
                variant="light" 
                onClick={() => navigate('/family-library')}
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                家庭图书
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-ink">30+</p>
          <p className="text-sm text-muted">馆藏图书</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-secondary-500" />
          </div>
          <p className="text-2xl font-bold text-ink">12</p>
          <p className="text-sm text-muted">本周借阅</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-ink">98%</p>
          <p className="text-sm text-muted">借阅率</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink">热门图书推荐</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/library')}>
                查看更多 <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : books.length === 0 ? (
              <p className="text-muted text-center py-8">暂无推荐图书</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {books.map((book) => (
                  <div 
                    key={book.id} 
                    className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/library/book/${book.id}`)}
                  >
                    <div className="w-16 h-20 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-8 h-8 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-ink truncate">{book.title}</h3>
                      <p className="text-sm text-muted truncate">{book.author}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant={book.available_copies > 0 ? 'success' : 'warning'} size="sm">
                          {book.available_copies > 0 ? '可借阅' : '已借出'}
                        </Badge>
                        <span className="text-xs text-muted">库存: {book.available_copies}/{book.total_copies}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink">我的借阅</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/my-borrowing')}>
                查看全部 <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : recentBorrows.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-primary-400" />
                </div>
                <p className="text-muted">暂无借阅记录</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => navigate('/library')}
                >
                  去借阅
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBorrows.map((record, index) => {
                  const daysUntilDue = getDaysUntilDue(record.due_date);
                  const isOverdue = daysUntilDue < 0;
                  
                  return (
                    <div 
                      key={index} 
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <h3 className="font-medium text-ink text-sm truncate">{record.books.title}</h3>
                      <p className="text-xs text-muted">{record.books.author}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-1 text-xs">
                          <Clock className="w-3 h-3" />
                          <span className={isOverdue ? 'text-red-500' : 'text-muted'}>
                            {isOverdue ? `逾期 ${Math.abs(daysUntilDue)} 天` : `还有 ${daysUntilDue} 天`}
                          </span>
                        </div>
                        <Badge 
                          variant={isOverdue ? 'danger' : 'primary'} 
                          size="sm"
                        >
                          {isOverdue ? '逾期' : '借阅中'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {isAdmin() && (
            <Card className="p-6 mt-6">
              <h2 className="text-lg font-semibold text-ink mb-4">管理入口</h2>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin')}
                >
                  用户管理
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/library/add')}
                >
                  添加图书
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/library')}
                >
                  图书管理
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}