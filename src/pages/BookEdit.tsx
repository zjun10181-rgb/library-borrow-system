import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Image, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Card } from '@/components/common/Card';
import { getBookById, updateBook, getModules } from '@/utils/supabase';
import type { Book, Module } from '@/types';

export function BookEdit() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [isbn, setIsbn] = useState('');
  const [description, setDescription] = useState('');
  const [cover_url, setCoverUrl] = useState('');
  const [total_copies, setTotalCopies] = useState(1);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  useEffect(() => {
    if (cover_url) {
      setPreviewUrl(cover_url);
    } else {
      setPreviewUrl('');
    }
  }, [cover_url]);

  const fetchData = async (bookId: string) => {
    setLoading(true);
    try {
      const [{ data: bookData }, { data: modulesData }] = await Promise.all([
        getBookById(bookId),
        getModules(),
      ]);
      if (bookData) {
        setBook(bookData);
        setTitle(bookData.title);
        setAuthor(bookData.author);
        setCategory(bookData.category || '');
        setIsbn(bookData.isbn || '');
        setDescription(bookData.description || '');
        setCoverUrl(bookData.cover_url || '');
        setTotalCopies(bookData.total_copies);
      }
      setModules(modulesData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCoverUrl(base64);
        setPreviewUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCover = () => {
    if (!title) {
      setError('请先输入书名');
      return;
    }
    const prompt = encodeURIComponent(`book cover design for "${title}" by ${author || 'unknown'}, elegant, minimalist, literary style`);
    const imageUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=portrait_4_3`;
    setCoverUrl(imageUrl);
    setPreviewUrl(imageUrl);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !author || !book) {
      setError('书名和作者为必填项');
      return;
    }

    setSaving(true);

    try {
      await updateBook(book.id, {
        title,
        author,
        category,
        isbn,
        description,
        cover_url,
        total_copies,
      });

      navigate(`/library/book/${book.id}`);
    } catch (err) {
      setError('更新图书失败，请重试');
      setSaving(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate(`/library/book/${book.id}`)}>
          <ArrowLeft className="w-5 h-5 mr-1" />
          返回
        </Button>
        <h2 className="text-2xl font-serif font-bold text-ink">编辑图书</h2>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="书名 *"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入书名"
              required
            />
            <Input
              label="作者 *"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="请输入作者"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="ISBN"
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="请输入ISBN"
            />
            <Select label="分类" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">请选择分类</option>
              <option value="绘本">绘本</option>
              <option value="科普">科普</option>
              <option value="文学">文学</option>
              <option value="历史">历史</option>
              <option value="传记">传记</option>
              <option value="小说">小说</option>
              <option value="漫画">漫画</option>
              <option value="其他">其他</option>
            </Select>
            <Input
              label="馆藏数量"
              type="number"
              value={total_copies}
              onChange={(e) => setTotalCopies(parseInt(e.target.value) || 1)}
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">封面图片</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Input
                  type="text"
                  value={cover_url}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="输入图片URL，或点击下方按钮上传/生成"
                />
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={generateCover}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    自动生成封面
                  </Button>
                  <label className="flex items-center px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Image className="w-4 h-4 mr-2" />
                    上传本地图片
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-32 h-40 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="封面预览" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Image className="w-8 h-8 mx-auto mb-2" />
                      <span className="text-xs">封面预览</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Textarea
            label="简介"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入图书简介（可选）"
            rows={4}
          />

          {error && (
            <p className="text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(`/library/book/${book.id}`)}>
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="w-5 h-5 mr-2" />
              {saving ? '保存中...' : '保存修改'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
