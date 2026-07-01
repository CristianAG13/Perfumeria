import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-screen bg-stone-50 dark:bg-black flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                Algo salió mal
              </h2>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                Ocurrió un error inesperado. Podés volver al inicio o recargar la página.
              </p>
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-stone-400 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300">
                    Detalles técnicos
                  </summary>
                  <pre className="mt-2 p-3 rounded-lg bg-stone-100 dark:bg-stone-900 text-xs text-red-600 dark:text-red-400 overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.href = '/'}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
              >
                Volver al inicio
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
