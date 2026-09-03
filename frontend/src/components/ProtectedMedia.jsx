import { useEffect, useState } from "react";
import api, { mediaApi, API_ORIGIN } from "../api/axios";

// Renders a protected /uploads/* image or video by fetching it as an
// authenticated blob (Authorization header) rather than embedding any
// token in the <img>/<video> src URL. This is the primary, safest path
// for displaying issue media in-page.
//
// For "open in a new tab" / download links where a real URL is required,
// use `getShareableMediaUrl()` below instead, which mints a short-lived
// (2 minute) scoped token instead of reusing the long-lived session token.
export default function ProtectedMedia({ src, type = "image", alt = "", style, className, controls = true }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let objectUrl;
    let cancelled = false;
    setStatus("loading");
    setBlobUrl(null);

    mediaApi
      .get(src, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setBlobUrl(objectUrl);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  const boxStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(155,122,64,.12)",
    color: "#9B7A40",
    fontSize: ".7rem",
    fontWeight: 600,
    ...style,
  };

  if (status === "loading") {
    return (
      <div className={className} style={boxStyle} aria-busy="true" aria-label="Loading media">
        <span style={{ animation: "pulse 1.4s ease-in-out infinite" }}>Loading…</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={className} style={boxStyle} role="img" aria-label="Media failed to load">
        <span>⚠ Unavailable</span>
      </div>
    );
  }

  if (type === "video") {
    return <video src={blobUrl} controls={controls} className={className} style={style} />;
  }

  return <img src={blobUrl} alt={alt} className={className} style={style} />;
}

// Mints a short-lived, media-scoped token and returns a real URL suitable
// for "open in new tab" links or downloads - places using this should not
// cache the URL beyond a couple of minutes, since the token expires.
export async function getShareableMediaUrl(relativeSrc) {
  const res = await api.get("/auth/media-token");
  return `${API_ORIGIN}${relativeSrc}?token=${encodeURIComponent(res.data.token)}`;
}
