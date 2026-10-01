const configuredSite = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "gradewise-gamma.vercel.app";
const withProtocol = /^https?:\/\//i.test(configuredSite) ? configuredSite : `https://${configuredSite}`;

export const siteUrl = new URL(withProtocol).origin;
