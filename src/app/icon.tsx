import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// App icon: stacked-cards brand mark rendered to PNG, kept in sync with logo.tsx.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f7f2ea",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9a4225"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect
            x="3.6"
            y="6.4"
            width="13"
            height="14"
            rx="2"
            transform="rotate(-8 10.1 13.4)"
            opacity="0.45"
          />
          <rect
            x="6"
            y="4.6"
            width="13"
            height="14"
            rx="2"
            transform="rotate(5 12.5 11.6)"
            opacity="0.7"
          />
          <rect
            x="6.4"
            y="5.2"
            width="13.2"
            height="14.4"
            rx="2.2"
            fill="#9a4225"
            fillOpacity="0.08"
          />
          <rect x="6.4" y="5.2" width="13.2" height="14.4" rx="2.2" />
          <path d="M9.4 9.6h7" />
          <path d="M9.4 12.6h7" opacity="0.55" />
          <path d="M9.4 15.2h4.6" opacity="0.55" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
