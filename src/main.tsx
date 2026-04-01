/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import React from 'react'
import App from './App.tsx'
import './main.css'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
          },
        },
        React.createElement('h1', { style: { fontSize: '1.5rem', marginBottom: '1rem' } }, 'Ops! Algo deu errado.'),
        React.createElement('p', { style: { color: '#666', marginBottom: '1rem' } }, 'Tente recarregar a página.'),
        React.createElement(
          'button',
          {
            onClick: () => window.location.reload(),
            style: {
              padding: '0.75rem 2rem',
              background: '#003399',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
            },
          },
          'Recarregar',
        ),
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
