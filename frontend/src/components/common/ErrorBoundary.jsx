import { Component } from 'react';

/**
 * Catches render errors below it so one broken component shows a recovery
 * screen instead of blanking the whole app. Resets when the route changes.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    // A failed lazy chunk usually means a new deploy replaced old files.
    const isStaleChunk = /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i
      .test(String(this.state.error?.message));

    return (
      <div role="alert" className="px-5 pb-24 pt-20 sm:px-8">
        <div className="mx-auto max-w-xl">
          <p className="eyebrow">{isStaleChunk ? 'Update available' : 'Something went wrong'}</p>
          <h1 className="mt-4 font-heading text-[38px] leading-tight text-primary-950">
            {isStaleChunk ? 'Lexium has been updated.' : 'This page hit a problem.'}
          </h1>
          <p className="mt-4 text-[16px] leading-7 text-surface-700">
            {isStaleChunk
              ? 'Reload to get the latest version. Nothing you saved has been lost.'
              : 'Reloading usually fixes it. If it keeps happening, please tell us what you were doing.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => window.location.reload()} className="lx-btn lx-btn-primary lx-btn-lg">Reload page</button>
            <a href="/" className="lx-btn lx-btn-secondary lx-btn-lg">Go to home</a>
          </div>
        </div>
      </div>
    );
  }
}
