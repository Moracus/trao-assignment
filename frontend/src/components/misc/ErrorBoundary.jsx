import React from "react";

import { RefreshRounded, BugReportOutlined } from "@mui/icons-material";
import Button from "../ui/Button";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error Boundary:", error, errorInfo);
    // Later: send to Sentry / LogRocket
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg p-6">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2">
              <BugReportOutlined sx={{ fontSize: 34 }} />
            </div>

            <h1 className="text-2xl font-bold text-text">
              Something went wrong
            </h1>

            <p className="mt-2 text-sm text-muted">
              The application crashed unexpectedly. Try refreshing the page or
              return to the dashboard.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 max-h-32 overflow-auto rounded-xl bg-surface-2 p-3 text-left text-xs text-red-500">
                {this.state.error.toString()}
              </pre>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={this.handleReset}
              >
                Try Again
              </Button>

              <Button
                className="flex-1"
                onClick={() => window.location.reload()}
              >
                <RefreshRounded fontSize="small" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
