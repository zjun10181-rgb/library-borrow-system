import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Calendar, RotateCcw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { getBorrowRecords, returnBook, updateBook, getBookById } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';
import type { BorrowRecord } from '@/types';

interface BorrowRecordWithBook extends BorrowRecord {
  books: {
    title: string;
    author: string;
    id: string;
  };
}

export function MyBorrowing() {
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecordWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<string | null>(null);
  
  const { user } = useAuthStore();

  useEffect(() => {
    fetchBorrowRecords();
  }, []);

  const fetchBorrowRecords = async () => {
    setLoading(true);
    try {
      const { data } = await getBorrowRecords(user?.id);
      setBorrowRecords(data || []);
    } catch (error) {
      console.error('Failed to fetch borrow records:', error);
    }
    setLoading(false);
  };

  const handleReturn = async (record: BorrowRecordWithBook) => {
    setReturningId(record.id);
    try {
      await returnBook(record.id);
      const { data: bookData } = await getBookById(record.books.id);
      if (bookData) {
        await updateBook(record.books.id, {
          available_copies: bookData.available_copies + 1,
        });
      }
      fetchBorrowRecords();
    } catch (error) {
      console.error('Failed to return book:', error);
    }
    setReturningId(null);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const activeRecords = borrowRecords.filter(r => r.status === 'borrowed');
  const returnedRecords = borrowRecords.filter(r => r.status === 'returned');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => window.history.back()}>
          <ArrowLeft className="w-5 h-5 mr-1" />
          返回
        </Button>
        <h2 className="text-2xl font-serif font-bold text-ink">我的借阅</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <BookOpen className="w-6 h-6 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-ink">{activeRecords.length}</p>
          <p className="text-sm text-muted">当前借阅</p>
        </Card>
        <Card className="text-center">
          <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Calendar className="w-6 h-6 text-secondary-500" />
          </div>
          <p className="text-2xl font-bold text-ink">
            {activeRecords.filter(r => getDaysUntilDue(r.due_date) < 0).length}
          </p>
          <p className="text-sm text-muted">逾期</p>
        </Card>
        <Card className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <RotateCcw className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-ink">{returnedRecords.length}</p>
          <p className="text-sm text-muted">已归还</p>
        </Card>
        <Card className="text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <BookOpen className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-ink">{borrowRecords.length}</p>
          <p className="text-sm text-muted">总计借阅</p>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-ink mb-4">当前借阅</h3>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : activeRecords.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-primary-400" />
            </div>
            <h4 className="text-lg font-semibold text-ink">暂无借阅</h4>
            <p className="text-muted mt-2">快去图书馆借阅一本好书吧</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeRecords.map((record) => {
              const daysUntilDue = getDaysUntilDue(record.due_date);
              const isOverdue = daysUntilDue < 0;
              
              return (
                <Card key={record.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-ink">{record.books.title}</h4>
                      <p className="text-sm text-muted">{record.books.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-muted">应还日期</p>
                      <p className={`font-medium ${isOverdue ? 'text-red-500' : daysUntilDue <= 3 ? 'text-yellow-600' : 'text-ink'}`}>
                        {record.due_date}
                      </p>
                      {isOverdue ? (
                        <Badge variant="danger" className="mt-1">逾期 {Math.abs(daysUntilDue)} 天</Badge>
                      ) : daysUntilDue <= 3 ? (
                        <Badge variant="warning" className="mt-1">即将到期</Badge>
                      ) : (
                        <Badge variant="success" className="mt-1">还有 {daysUntilDue} 天</Badge>
                      )}
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleReturn(record)}
                      disabled={returningId === record.id}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      {returningId === record.id ? '处理中...' : '归还'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {returnedRecords.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-ink mb-4">借阅历史</h3>
          <div className="space-y-4">
            {returnedRecords.map((record) => (
              <Card key={record.id} className="flex items-center justify-between opacity-75">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink">{record.books.title}</h4>
                    <p className="text-sm text-muted">{record.books.author}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-muted">借阅: {record.borrow_date}</span>
                      <span className="text-xs text-muted">归还: {record.return_date}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="success">已归还</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}