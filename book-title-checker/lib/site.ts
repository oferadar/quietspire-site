/**
 * Canonical site URL, used for metadata, sitemap, robots and the User-Agent
 * we send to Open Library. Set NEXT_PUBLIC_SITE_URL once the domain is known;
 * until then Vercel's own production URL is used, and localhost in dev.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "Book Title Checker";

/** The studio that runs the site. Shown in the footer, About and Privacy pages. */
export const OWNER_NAME = "Quietspire";
export const OWNER_LEGAL_NAME = "Quietspire LLC";
export const OWNER_URL = "https://quietspire.com";
export const SUPPORT_EMAIL = "support@quietspire.com";
