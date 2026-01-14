'use client';

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">משהו השתבש</h2>
          <p className="text-gray-600 mb-4 max-w-sm">
            אירעה שגיאה בטעינת הדף. נסה לרענן את הדף או לחזור מאוחר יותר.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            נסה שוב
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundary for schedule/booking
export function ScheduleErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center p-6 text-center bg-gray-50 rounded-xl" dir="rtl">
      <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-10 h-10 text-orange-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">לא ניתן לטעון את לוח הביקורים</h2>
      <p className="text-gray-600 mb-4 max-w-sm">
        בדוק את החיבור לאינטרנט ונסה שוב.
        <br />
        <span className="text-sm">אם הבעיה נמשכת, פנה למנהל המערכת.</span>
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          רענן
        </button>
      )}
    </div>
  );
}

// Network error component for offline state
export function OfflineMessage() {
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-lg z-50" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium text-yellow-800">אין חיבור לאינטרנט</p>
          <p className="text-sm text-yellow-700">מציג נתונים שמורים</p>
        </div>
      </div>
    </div>
  );
}
