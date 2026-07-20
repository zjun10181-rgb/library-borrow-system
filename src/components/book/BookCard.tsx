import { BookOpen, User } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import type { Book } from '@/types';

interface BookCardProps {
  book: Book;
  onClick: () => void;
}

export function BookCard({ book, onClick }: BookCardProps) {
  const isAvailable = book.available_copies > 0;

  return (
    <Card hoverable onClick={onClick} className="flex flex-col">
      <div className="flex items-start space-x-4">
        <div className="w-20 h-28 bg-primary-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
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
            <BookOpen className="w-10 h-10 text-primary-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-semibold text-ink truncate">
              {book.title}
            </h3>
            <Badge variant={isAvailable ? 'success' : 'warning'}>
              {isAvailable ? '可借阅' : '已借出'}
            </Badge>
          </div>
          <p className="text-sm text-muted mt-1">
            {book.author}
          </p>
          {book.category && (
            <span className="inline-block text-xs px-2 py-0.5 bg-cream rounded-full text-muted mt-2">
              {book.category}
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-divider flex items-center justify-between text-sm">
        <div className="flex items-center space-x-1 text-muted">
          <User className="w-4 h-4" />
          <span>库存: {book.available_copies}/{book.total_copies}</span>
        </div>
        {book.isbn && (
          <span className="text-xs text-muted">ISBN: {book.isbn}</span>
        )}
      </div>
    </Card>
  );
}