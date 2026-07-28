import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  src?: string;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-12 h-16',
  md: 'w-20 h-28',
  lg: 'w-full aspect-[3/4]',
};

const iconSizeMap = {
  sm: 'w-5 h-5',
  md: 'w-10 h-10',
  lg: 'w-20 h-20',
};

export function BookCover({ src, alt, className = '', size = 'md' }: BookCoverProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`${sizeMap[size]} bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}>
        <BookOpen className={`${iconSizeMap[size]} text-primary-400`} />
      </div>
    );
  }

  return (
    <div className={`${sizeMap[size]} rounded-lg flex-shrink-0 overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
