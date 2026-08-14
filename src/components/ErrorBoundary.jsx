import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#fff',
          fontFamily: 'sans-serif'
        }}>
          <h2 style={{ color: 'var(--gold, #d4af37)', marginBottom: '12px' }}>
            பக்கத்தை ஏற்றுவதில் சிறிய பிழை ஏற்பட்டது (Something went wrong)
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', maxWidth: '500px', margin: '0 auto 20px auto' }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button 
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            style={{
              background: 'var(--gold, #d4af37)',
              color: '#000',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            பக்கத்தை புதுப்பி (Reload Page)
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
