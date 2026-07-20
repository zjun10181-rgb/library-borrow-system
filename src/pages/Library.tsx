import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, BookOpen } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { BookCard } from '@/components/book/BookCard';
import { getBooks, getModules } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Book, Module } from '@/types';

export function Library() {
  const [books, setBooks] = useState<Book[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { isAdmin } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [keyword, category, selectedModule]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: booksData }, { data: modulesData }] = await Promise.all([
        getBooks({
          keyword: keyword || undefined,
          category: category || undefined,
          module_id: selectedModule || undefined,
        }),
        getModules(),
      ]);
      setBooks(booksData || []);
      setModules(modulesData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const categories = [...new Set(books.map(b => b.category).filter(Boolean))];

  const handleBookClick = (book: Book) => {
    navigate(`/library/book/${book.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-ink">图书管理</h2>
          <p className="text-muted mt-1">浏览和管理图书馆馆藏图书</p>
        </div>
        {isAdmin() && (
          <Button onClick={() => navigate('/library/add')}>
            <Plus className="w-5 h-5 mr-2" />
            添加图书
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-divider">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <Input
                type="text"
                placeholder="搜索书名或作者..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-12"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-48">
              <Select 
                value={selectedModule} 
                onChange={(e) => setSelectedModule(e.target.value)}
              >
                <option value="">全部模块</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-48">
              <Select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">全部分类</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-ink">暂无图书</h3>
          <p className="text-muted mt-2">还没有添加任何图书，点击上方按钮添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} onClick={() => handleBookClick(book)} />
          ))}
        </div>
      )}
    </div>
  );
}