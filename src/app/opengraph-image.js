import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";

export const alt = `${profile.name} — ${profile.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          color: "white",
          background: "radial-gradient(circle at 85% 0%, #6d28d9 0%, #07060b 55%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 6, color: "#c4b5fd" }}>BHAWUK ORIGINAL · NOW STREAMING</div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 800, marginTop: 24 }}>{profile.name}</div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 12, color: "#e5e7eb" }}>
          {profile.role} — {profile.tagline}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 48, fontSize: 26, color: "#a5f3fc" }}>
          <span>Shaka Player · DASH · HLS · DRM</span>
          <span style={{ color: "#6b7280" }}>|</span>
          <span>{profile.company}</span>
        </div>
      </div>
    ),
    size,
  );
}
