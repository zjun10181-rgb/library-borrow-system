import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, BookOpen, User, Calendar, Tag, FileText } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { getBookById, deleteBook, getModules } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Book, Module } from '@/types';

export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [moduleName, setModuleName] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const { isAdmin } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchBook(id);
    }
  }, [id]);

  const fetchBook = async (bookId: string) => {
    setLoading(true);
    try {
      const { data: bookData } = await getBookById(bookId);
      if (bookData) {
        setBook(bookData);
        const { data: modulesData } = await getModules();
        const mod = modulesData?.find(m => m.id === bookData.module_id);
        setModuleName(mod?.name || '未知模块');
      }
    } catch (error) {
      console.error('Failed to fetch book:', error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!book) return;
    try {
      await deleteBook(book.id);
      navigate('/library');
    } catch (error) {
      console.error('Failed to delete book:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-ink">图书不存在</h3>
        <Button variant="outline" onClick={() => navigate('/library')} className="mt-4">
          返回图书列表
        </Button>
      </div>
    );
  }

  const isAvailable = book.available_copies > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/library')}>
          <ArrowLeft className="w-5 h-5 mr-1" />
          返回
        </Button>
        <h2 className="text-2xl font-serif font-bold text-ink">图书详情</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <div className="w-full aspect-[3/4] bg-primary-100 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
              {book.cover_url ? (
                <img 
                  src={book.cover_url} 
                  alt={book.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <BookOpen className="w-20 h-20 text-primary-300" />
              )}
            </div>
            <div className="flex gap-2">
              {isAdmin() && (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/library/edit/${book.id}`)}>
                    <Edit className="w-4 h-4 mr-1" />
                    编辑
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    删除
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-serif font-bold text-ink">{book.title}</h1>
                <p className="text-muted mt-1">{book.author}</p>
              </div>
              <Badge variant={isAvailable ? 'success' : 'warning'} className="text-lg px-3 py-1">
                {isAvailable ? '可借阅' : '已借出'}
              </Badge>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-ink mb-4">图书信息</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-muted">库存状态</p>
                  <p className="font-medium text-ink">
                    {book.available_copies} / {book.total_copies} 本
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm text-muted">分类</p>
                  <p className="font-medium text-ink">{book.category || '未分类'}</p>
                </div>
              </div>
              {book.isbn && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center">
                    <FileText className="w-4 h-4 text-muted" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">ISBN</p>
                    <p className="font-medium text-ink">{book.isbn}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-muted" />
                </div>
                <div>
                  <p className="text-sm text-muted">所属模块</p>
                  <p className="font-medium text-ink">{moduleName}</p>
                </div>
              </div>
            </div>
          </Card>

          {book.description && (
            <Card>
              <h3 className="font-semibold text-ink mb-2">简介</h3>
              <p className="text-muted leading-relaxed">{book.description}</p>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={() => navigate('/library/borrow?bookId=' + book.id)}>
              <BookOpen className="w-5 h-5 mr-2" />
              借阅此书
            </Button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-ink mb-2">确认删除</h3>
            <p className="text-muted mb-4">确定要删除这本图书吗？此操作无法撤销。</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                取消
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}