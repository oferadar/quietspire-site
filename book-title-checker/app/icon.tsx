import { ImageResponse } from "next/og";

/** Browser tab icon: the verdict stamp, in the accent green. Generated at build. */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#1e5b47",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 22,
            height: 14,
            border: "2px solid #f2f4f3",
            borderRadius: 2,
            padding: 2,
            display: "flex",
          }}
        >
          <div style={{ width: "100%", height: "100%", border: "1px solid #f2f4f3", borderRadius: 1 }} />
        </div>
      </div>
    ),
    size,
  );
}
