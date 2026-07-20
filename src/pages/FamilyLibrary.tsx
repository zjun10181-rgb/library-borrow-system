import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Plus, Trash2, Edit2, Users, Home, 
  Search, ArrowRight, FolderOpen, X, Image, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { useAuthStore } from '@/store/authStore';
import { 
  getFamilies, 
  getFamilyBooks, 
  getModules, 
  createBook, 
  deleteBook, 
  updateBook,
  createFamily,
  addFamilyMember,
  getUsers
} from '@/utils/supabase';
import type { Family, Book, Module } from '@/types';

interface BookFormData {
  title: string;
  author: string;
  category?: string;
  isbn?: string;
  description?: string;
  cover_url?: string;
  total_copies: number;
  module_id: string;
}

interface FamilyFormData {
  name: string;
}

interface MemberFormData {
  familyId: string;
  userId: string;
}

export function FamilyLibrary() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [booksByFamily, setBooksByFamily] = useState<Record<string, Book[]>>({});
  const [modules, setModules] = useState<Module[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  
  const [bookForm, setBookForm] = useState<BookFormData>({
    title: '',
    author: '',
    category: '家庭图书',
    isbn: '',
    description: '',
    cover_url: '',
    total_copies: 1,
    module_id: '',
  });
  
  const [previewUrl, setPreviewUrl] = useState('');
  
  const [familyForm, setFamilyForm] = useState<FamilyFormData>({
    name: '',
  });
  
  const [memberForm, setMemberForm] = useState<MemberFormData>({
    familyId: '',
    userId: '',
  });

  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (bookForm.cover_url) {
      setPreviewUrl(bookForm.cover_url);
    } else {
      setPreviewUrl('');
    }
  }, [bookForm.cover_url]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: familiesData }, { data: modulesData }, { data: usersData }] = await Promise.all([
        getFamilies(user?.id),
        getModules(),
        getUsers(),
      ]);
      
      setFamilies(familiesData || []);
      setModules(modulesData || []);
      setUsers(usersData || []);
      
      const familyBooks: Record<string, Book[]> = {};
      if (familiesData) {
        for (const family of familiesData) {
          const { data: booksData } = await getFamilyBooks(family.id);
          familyBooks[family.id] = booksData?.map(item => item.books) || [];
        }
      }
      setBooksByFamily(familyBooks);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const canManageFamily = (family: Family) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return family.members.includes(user.id) || family.head_of_family === user.id;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setBookForm({ ...bookForm, cover_url: base64 });
        setPreviewUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCover = () => {
    if (!bookForm.title) {
      return;
    }
    const prompt = encodeURIComponent(`book cover design for "${bookForm.title}" by ${bookForm.author || 'unknown'}, elegant, minimalist, literary style`);
    const imageUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=portrait_4_3`;
    setBookForm({ ...bookForm, cover_url: imageUrl });
    setPreviewUrl(imageUrl);
  };

  const getFamilyModule = (familyId: string) => {
    return modules.find(m => m.type === 'family' && m.owner_id === familyId);
  };

  const handleSelectFamily = (family: Family) => {
    setSelectedFamily(family);
    const familyModule = getFamilyModule(family.id);
    if (familyModule) {
      setBookForm(prev => ({ ...prev, module_id: familyModule.id }));
    }
  };

  const handleAddBook = async () => {
    if (!bookForm.title || !bookForm.author) return;
    
    try {
      await createBook({
        ...bookForm,
        available_copies: bookForm.total_copies,
      });
      setShowBookModal(false);
      setBookForm({
        title: '',
        author: '',
        category: '家庭图书',
        isbn: '',
        description: '',
        cover_url: '',
        total_copies: 1,
        module_id: bookForm.module_id,
      });
      fetchData();
    } catch (error) {
      console.error('Failed to add book:', error);
    }
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      category: book.category || '家庭图书',
      isbn: book.isbn || '',
      description: book.description || '',
      cover_url: book.cover_url || '',
      total_copies: book.total_copies,
      module_id: book.module_id,
    });
    setShowBookModal(true);
  };

  const handleUpdateBook = async () => {
    if (!editingBook) return;
    
    try {
      await updateBook(editingBook.id, {
        title: bookForm.title,
        author: bookForm.author,
        category: bookForm.category,
        isbn: bookForm.isbn,
        description: bookForm.description,
        cover_url: bookForm.cover_url,
        total_copies: bookForm.total_copies,
      });
      setShowBookModal(false);
      setEditingBook(null);
      setBookForm({
        title: '',
        author: '',
        category: '家庭图书',
        isbn: '',
        description: '',
        cover_url: '',
        total_copies: 1,
        module_id: bookForm.module_id,
      });
      fetchData();
    } catch (error) {
      console.error('Failed to update book:', error);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('确定要删除这本图书吗？')) return;
    
    try {
      await deleteBook(bookId);
      fetchData();
    } catch (error) {
      console.error('Failed to delete book:', error);
    }
  };

  const handleCreateFamily = async () => {
    if (!familyForm.name || !user?.id) return;
    
    try {
      await createFamily({
        name: familyForm.name,
        head_of_family: user.id,
      });
      setShowFamilyModal(false);
      setFamilyForm({ name: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to create family:', error);
    }
  };

  const handleAddMember = async () => {
    if (!memberForm.familyId || !memberForm.userId) return;
    
    try {
      await addFamilyMember(memberForm.familyId, memberForm.userId);
      setShowMemberModal(false);
      setMemberForm({ familyId: '', userId: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const filteredBooks = (familyId: string) => {
    const familyBooks = booksByFamily[familyId] || [];
    if (!searchKeyword) return familyBooks;
    const keyword = searchKeyword.toLowerCase();
    return familyBooks.filter(book =>
      book.title.toLowerCase().includes(keyword) ||
      book.author.toLowerCase().includes(keyword)
    );
  };

  const getFamilyMemberNames = (memberIds: string[]) => {
    return memberIds.map(id => {
      const userData = users.find(u => u.id === id);
      return userData?.name || id;
    }).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">家庭图书</h1>
          <p className="text-muted mt-1">管理家庭成员共享的个人藏书</p>
        </div>
        {user && (
          <Button onClick={() => setShowFamilyModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            创建家庭
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-ink">家庭列表</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowFamilyModal(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : families.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Home className="w-6 h-6 text-primary-400" />
                </div>
                <p className="text-muted">暂无家庭</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => setShowFamilyModal(true)}
                >
                  创建家庭
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {families.map((family) => (
                  <div
                    key={family.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFamily?.id === family.id
                        ? 'bg-primary-50 border border-primary-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => handleSelectFamily(family)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="w-5 h-5 text-primary-500" />
                        <span className="font-medium text-ink">{family.name}</span>
                      </div>
                      <Badge variant="secondary" size="sm">
                        {booksByFamily[family.id]?.length || 0}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted mt-1 flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {getFamilyMemberNames(family.members)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {selectedFamily && (
            <Card className="p-4 mt-4">
              <h3 className="font-medium text-ink mb-3">家庭管理</h3>
              <Button 
                variant="outline" 
                className="w-full justify-start mb-2"
                onClick={() => {
                  setMemberForm({ ...memberForm, familyId: selectedFamily.id });
                  setShowMemberModal(true);
                }}
              >
                <Users className="w-4 h-4 mr-2" />
                添加成员
              </Button>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3">
          {selectedFamily ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-ink">
                    {selectedFamily.name}藏书
                  </h2>
                  <p className="text-sm text-muted">
                    共 {filteredBooks(selectedFamily.id).length} 本图书
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                    <Input
                      placeholder="搜索图书..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  {canManageFamily(selectedFamily) && (
                    <Button onClick={() => setShowBookModal(true)}>
                      <Plus className="w-5 h-5 mr-2" />
                      添加图书
                    </Button>
                  )}
                </div>
              </div>

              {filteredBooks(selectedFamily.id).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-primary-400" />
                  </div>
                  <p className="text-muted">该家庭暂无藏书</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowBookModal(true)}
                  >
                    添加第一本图书
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBooks(selectedFamily.id).map((book) => (
                    <div key={book.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-20 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-8 h-8 text-primary-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-ink truncate">{book.title}</h3>
                            <p className="text-sm text-muted truncate">{book.author}</p>
                            {book.isbn && (
                              <p className="text-xs text-muted mt-1">ISBN: {book.isbn}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant={book.available_copies > 0 ? 'success' : 'warning'} size="sm">
                                {book.available_copies > 0 ? '可借阅' : '已借出'}
                              </Badge>
                              <span className="text-xs text-muted">
                                库存: {book.available_copies}/{book.total_copies}
                              </span>
                            </div>
                          </div>
                        </div>
                        {canManageFamily(selectedFamily) && (
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditBook(book)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500"
                              onClick={() => handleDeleteBook(book.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {book.description && (
                        <p className="text-sm text-muted mt-3 line-clamp-2">
                          {book.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-10 h-10 text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-ink mb-2">选择一个家庭</h2>
              <p className="text-muted">从左侧列表选择一个家庭，查看和管理其藏书</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowFamilyModal(true)}
              >
                创建新家庭
              </Button>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={showBookModal}
        onClose={() => {
          setShowBookModal(false);
          setEditingBook(null);
        }}
        title={editingBook ? '编辑图书' : '添加图书'}
      >
        <div className="space-y-4">
          <Input
            label="书名"
            value={bookForm.title}
            onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
            placeholder="请输入书名"
          />
          <Input
            label="作者"
            value={bookForm.author}
            onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
            placeholder="请输入作者"
          />
          <Input
            label="ISBN"
            value={bookForm.isbn}
            onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
            placeholder="请输入ISBN（可选）"
          />
          <Input
            label="分类"
            value={bookForm.category}
            onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
            placeholder="请输入分类"
          />
          <Input
            label="总库存"
            type="number"
            value={bookForm.total_copies}
            onChange={(e) => setBookForm({ ...bookForm, total_copies: parseInt(e.target.value) || 1 })}
            min="1"
          />
          <div>
            <label className="block text-sm font-medium text-ink mb-2">封面图片</label>
            <div className="space-y-2">
              <Input
                type="text"
                value={bookForm.cover_url}
                onChange={(e) => setBookForm({ ...bookForm, cover_url: e.target.value })}
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
              <div className="flex justify-center">
                <div className="w-24 h-32 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="封面预览" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Image className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-xs">封面预览</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <textarea
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={3}
            placeholder="图书描述（可选）"
            value={bookForm.description}
            onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
          />
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => {
              setShowBookModal(false);
              setEditingBook(null);
            }}>
              取消
            </Button>
            <Button onClick={editingBook ? handleUpdateBook : handleAddBook}>
              {editingBook ? '保存修改' : '添加图书'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showFamilyModal}
        onClose={() => setShowFamilyModal(false)}
        title="创建家庭"
      >
        <div className="space-y-4">
          <Input
            label="家庭名称"
            value={familyForm.name}
            onChange={(e) => setFamilyForm({ name: e.target.value })}
            placeholder="例如：张三家庭"
          />
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowFamilyModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateFamily}>
              创建家庭
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        title="添加家庭成员"
      >
        <div className="space-y-4">
          <select
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={memberForm.userId}
            onChange={(e) => setMemberForm({ ...memberForm, userId: e.target.value })}
          >
            <option value="">选择成员</option>
            {users.filter(u => u.role !== 'admin').map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowMemberModal(false)}>
              取消
            </Button>
            <Button onClick={handleAddMember}>
              添加成员
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}