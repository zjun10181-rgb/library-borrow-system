import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { getBorrowRecords, returnBook, updateBook, getBookById } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';
import type { BorrowRecordWithBook } from '@/types';

export function ReturnForm() {
  const [searchTerm, setSearchTerm] = useState('');
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecordWithBook[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<BorrowRecordWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<string | null>(null);
  
  const { isAdmin, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBorrowRecords();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredRecords(borrowRecords);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredRecords(borrowRecords.filter(record => 
        record.books.title.toLowerCase().includes(term) ||
        record.books.author.toLowerCase().includes(term) ||
        record.users.name.toLowerCase().includes(term)
      ));
    }
  }, [searchTerm, borrowRecords]);

  const fetchBorrowRecords = async () => {
    setLoading(true);
    try {
      const userId = isAdmin() ? undefined : user?.id;
      const { data } = await getBorrowRecords(userId);
      const activeRecords = (data || []).filter((r: BorrowRecordWithBook) => r.status === 'borrowed');
      setBorrowRecords(activeRecords);
      setFilteredRecords(activeRecords);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/library')}>
          <ArrowLeft className="w-5 h-5 mr-1" />
          返回
        </Button>
        <h2 className="text-2xl font-serif font-bold text-ink">归还图书</h2>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-divider">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <Input
            type="text"
            placeholder="搜索书名、作者或借阅人..."
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
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-ink">暂无借阅记录</h3>
          <p className="text-muted mt-2">当前没有正在借阅中的图书</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const daysUntilDue = getDaysUntilDue(record.due_date);
            const isOverdue = daysUntilDue < 0;
            
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
                      <span className="text-xs text-muted">借阅日期: {record.borrow_date}</span>
                    </div>
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
  );
}