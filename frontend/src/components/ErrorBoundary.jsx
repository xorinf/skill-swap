import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[boundary]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="card border-red-300">
          <h2 className="text-lg font-semibold text-red-700">Something broke on this page.</h2>
          <p className="muted mt-1 text-sm">Reload, and if it keeps happening, copy the message below.</p>
          <pre className="mt-3 max-h-60 overflow-auto rounded bg-ink-50 p-3 text-xs">{String(this.state.error?.message || this.state.error)}</pre>
          <button className="btn-secondary mt-3" onClick={() => this.setState({ error: null })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
