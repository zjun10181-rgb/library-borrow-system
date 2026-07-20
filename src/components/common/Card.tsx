import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hoverable = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-divider rounded-xl p-6 shadow-sm ${
        hoverable ? 'hover:shadow-lg hover:border-primary-200 cursor-pointer transition-all duration-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}