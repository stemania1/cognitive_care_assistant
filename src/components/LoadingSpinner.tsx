/**
 * Reusable loading spinner component
 */

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md',
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center justify-center min-h-screen ${className}`}>
      <div className="text-center">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-white border-t-transparent mx-auto mb-4`}></div>
        <p className="text-white/70">{message}</p>
      </div>
    </div>
  );
}

/**
 * Inline loading spinner for use within pages
 */
export function InlineLoadingSpinner({ 
  message = 'Loading...', 
  size = 'sm',
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-white border-t-transparent`}></div>
      <p className="text-white/70 text-sm">{message}</p>
    </div>
  );
}

