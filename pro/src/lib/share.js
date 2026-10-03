// Scenario sharing: the whole data set of a page (structure + values) is
// encoded into a base64url token carried in the URL hash (`#s=<token>`).
// The payload is our own ASCII-only JSON (numbers + structure keys), so a
// plain base64 is enough; anything that fails to parse decodes to null.

export const encodeScenario = (scenario) => {
  const json = JSON.stringify(scenario);
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const decodeScenario = (token) => {
  if (!token) return null;
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const parsed = JSON.parse(atob(padded));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const readScenario = (hash) => {
  const source = hash ?? (typeof window !== 'undefined' ? window.location.hash : '');
  const match = /[#&]s=([^&]+)/.exec(source || '');
  if (!match) return null;
  return decodeScenario(match[1]);
};

// Build a shareable absolute URL for the current page + scenario.
export const buildShareUrl = (scenario, location = window.location) => {
  const token = encodeScenario(scenario);
  return `${location.origin}${location.pathname}${location.search}#s=${token}`;
};
