export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime.
// On Manus: redirects to Manus OAuth portal.
// On Railway (no VITE_OAUTH_PORTAL_URL): redirects to local /login page.
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Railway / local auth — no OAuth portal configured
  if (!oauthPortalUrl || !appId) {
    const base = `${window.location.origin}/login`;
    return returnPath ? `${base}?returnTo=${encodeURIComponent(returnPath)}` : base;
  }

  // Manus OAuth
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  return url.toString();
};
