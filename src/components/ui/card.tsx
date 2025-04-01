import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'w-full rounded-xl bg-white/80 backdrop-blur-md border border-gray-200/50',
      'shadow-[inset_2px_2px_5px_rgba(255,255,255,0.7),inset_-2px_-2px_5px_rgba(0,0,0,0.1),5px_5px_15px_rgba(0,0,0,0.1)]',
      'transition-all duration-300 hover:shadow-[inset_3px_3px_6px_rgba(255,255,255,0.8),inset_-3px_-3px_6px_rgba(0,0,0,0.15),8px_8px_20px_rgba(0,0,0,0.15)]',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'p-3 border-b border-gray-200/50 flex items-center justify-between w-full',
      className
    )}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-3 flex flex-row flex-wrap gap-4', className)}
    {...props}
  />
));
CardContent.displayName = 'CardContent';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-medium text-gray-800 flex items-center',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export { Card, CardContent, CardHeader, CardTitle };