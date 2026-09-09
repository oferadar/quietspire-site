import { ImageResponse } from "next/og";

/** Home-screen icon. iOS rounds the corners itself, so this one is square. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#1e5b47",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 120,
            height: 76,
            border: "8px solid #f2f4f3",
            borderRadius: 10,
            padding: 8,
            display: "flex",
          }}
        >
          <div style={{ width: "100%", height: "100%", border: "4px solid #f2f4f3", borderRadius: 4 }} />
        </div>
      </div>
    ),
    size,
  );
}
