// Last-resort error boundary. If any page throws during render, this catches
// it and shows the actual error message instead of a blank screen.
import { Component } from 'react';

export default class PageErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[page-error]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="card border-red-300">
          <h2 className="text-lg font-semibold text-red-700">This page failed to render.</h2>
          <p className="mt-1 text-sm text-ink-700">Copy the message below and send it to support.</p>
          <pre className="mt-3 max-h-72 overflow-auto rounded bg-ink-50 p-3 text-xs whitespace-pre-wrap">
{String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
          <button className="btn-secondary mt-3" onClick={() => this.setState({ error: null })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
