import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>कुछ गलत हो गया</h2>
          <p>कृपया पेज को रीफ्रेश करें या बाद में पुनः प्रयास करें</p>
          <button onClick={() => window.location.reload()}>
            पेज रीफ्रेश करें
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 