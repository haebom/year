import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const toastVariants = cva(
  'fixed bottom-4 right-4 flex items-center gap-2 rounded-lg p-4 shadow-lg transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-white text-gray-900',
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  message: string;
  onClose: () => void;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ message, variant, onClose, className, ...props }, ref) => {
    React.useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }, [onClose]);

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant, className }))}
        {...props}
      >
        <span>{message}</span>
        <button
          onClick={onClose}
          className="rounded-full p-1 hover:bg-black/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

export { Toast, toastVariants }; 