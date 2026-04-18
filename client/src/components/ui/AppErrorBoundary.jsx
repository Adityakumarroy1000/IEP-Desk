import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-red-50 px-4 py-12 text-gray-900">
          <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-600">App failed to start</p>
            <h1 className="mt-2 text-2xl font-bold">The frontend crashed during startup.</h1>
            <p className="mt-3 text-sm text-gray-600">
              This usually means a required Vercel environment variable is missing or invalid.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-gray-950 p-4 text-sm text-red-200">
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
