import { type ButtonHTMLAttributes, forwardRef, isValidElement, cloneElement, type ReactElement } from 'react';
import { cn } from '../utils/cn';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  /** When true, renders the child element directly with button styles applied. */
  asChild?: boolean;
};

const buttonClasses = (variant: ButtonProps['variant'], className?: string) =>
  cn(
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
    variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
    variant === 'secondary' && 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-100',
    variant === 'ghost' && 'bg-transparent text-slate-700 hover:bg-slate-100',
    className
  );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', asChild = false, children, ...props }, ref) => {
    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{ className?: string }>;
      return cloneElement(child, {
        ...props,
        className: buttonClasses(variant, cn(child.props.className, className)),
      } as Record<string, unknown>);
    }

    return (
      <button
        ref={ref}
        className={buttonClasses(variant, className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
