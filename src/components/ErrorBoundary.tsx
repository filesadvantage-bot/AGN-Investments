import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const raw = error instanceof Error ? error.message : String(error);
    let readable = raw;
    try {
      const parsed = JSON.parse(raw) as { error?: string; operationType?: string; path?: string };
      if (parsed && parsed.error) {
        readable = `${parsed.error}${parsed.operationType ? ` (${parsed.operationType} ${parsed.path || ''})` : ''}`;
      }
    } catch {
      // Keep raw message when not a JSON FirestoreErrorInfo payload
    }
    return { hasError: true, message: readable };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h1 className="text-lg font-extrabold text-slate-900">
                Something interrupted Aqua Nest
              </h1>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed break-words bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Storefront</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
