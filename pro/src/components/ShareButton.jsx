import React, { useState } from "react";
import { buildShareUrl } from "../lib/share";

const ShareButton = ({ structure, values, extra }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const scenario = { v: 1, structure, values, ...(extra ?? {}) };
    const url = buildShareUrl(scenario);
    window.location.hash = url.split("#")[1];
    try {
      await navigator.clipboard?.writeText(url);
    } catch {
      // Clipboard unavailable (permissions / insecure context) — the hash
      // link still works when copied from the address bar.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className="share-row">
      <button type="button" className="btn share-btn" onClick={handleShare}>
        Share
      </button>
      {copied && (
        <span className="share-note" role="status">
          Link copied!
        </span>
      )}
    </span>
  );
};

export default ShareButton;
