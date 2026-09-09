import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

/** Link preview for every page. Generated at build; no runtime cost. */
export const alt = `${SITE_NAME}: see which published books already use a title`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#f2f4f3",
          color: "#16201c",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontSize: 30, fontWeight: 500 }}>{SITE_NAME}</div>
          <div
            style={{
              display: "flex",
              border: "4px solid #9b2431",
              borderRadius: 6,
              padding: 6,
            }}
          >
            <div
              style={{
                border: "2px solid #9b2431",
                borderRadius: 3,
                padding: "10px 22px",
                color: "#9b2431",
                fontSize: 32,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Crowded
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 600, lineHeight: 1.05, maxWidth: 1000 }}>
            See which published books already use your title.
          </div>
          <div style={{ fontSize: 32, color: "#4b5751", maxWidth: 1000 }}>
            Free. No account. Clear, in use, or crowded, with the evidence underneath.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
