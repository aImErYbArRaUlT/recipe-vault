"use client";

// Renders when the root layout itself throws. Cannot rely on globals.css
// or any imported components - everything must be inline. Brand palette is
// hard-coded here to keep this self-contained.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#f7f2ea",
          color: "#1f1a17",
          fontFamily:
            "ui-serif, 'Iowan Old Style', Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "9999px",
              backgroundColor: "#f1d2cb",
              color: "#7a2618",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.25rem",
            }}
            aria-hidden="true"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 9v4M12 17v.5" />
              <path d="M10.3 3.6L2.8 16.2a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" />
            </svg>
          </div>
          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#c35a38",
              margin: 0,
            }}
          >
            Critical error
          </p>
          <h1
            style={{
              margin: "0.75rem 0 0",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Recipe Vault hit a snag
          </h1>
          <p
            style={{
              marginTop: "1rem",
              maxWidth: 420,
              color: "#5c544c",
              fontFamily:
                "ui-sans-serif, system-ui, sans-serif",
              fontSize: "1rem",
              lineHeight: 1.5,
            }}
          >
            Something failed before the app could load. Try reloading. Your
            recipes are safe.
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: "0.75rem",
                fontFamily:
                  "ui-monospace, SFMono-Regular, monospace",
                fontSize: "0.75rem",
                color: "#847a6f",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              marginTop: "1.75rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              backgroundColor: "#c35a38",
              color: "#fff",
              border: "1px solid #9a4225",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              boxShadow:
                "0 1px 0 rgba(31,26,23,0.04), 0 4px 14px -2px rgba(31,26,23,0.06)",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
