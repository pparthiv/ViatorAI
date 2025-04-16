import * as React from 'react';
import { cn } from '@/lib/utils';

const CustomCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full rounded-xl bg-white overflow-hidden", "shadow-md", "transition-all duration-300", className)}
    {...props}
  />
));
CustomCard.displayName = "CustomCard";

const CustomCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative h-[200px] w-full overflow-hidden", className)} {...props} />
  ),
);
CustomCardHeader.displayName = "CustomCardHeader";

const CustomCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6", className)} {...props} />,
);
CustomCardContent.displayName = "CustomCardContent";

const CustomCardTitle = React.forwardRef<
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
CustomCardTitle.displayName = 'CustomCardTitle';

export { CustomCard, CustomCardContent, CustomCardHeader, CustomCardTitle };