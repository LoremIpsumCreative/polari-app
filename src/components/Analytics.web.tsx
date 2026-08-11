import { Analytics as VercelAnalytics } from '@vercel/analytics/react';

// Vercel Web Analytics — the WEB half. See Analytics.tsx for why this is split.
//
// Cookieless and without cross-site identifiers, which is what makes it usable
// here without a consent banner: this app is about queer history, and the
// people reading it are more than averagely entitled not to be followed around.
// It records pageviews and route changes, nothing about who you are.
//
// `mode` is left to its default so the script only reports from the production
// deployment; preview builds and `expo start --web` stay out of the numbers
// rather than inflating them with our own testing.
//
// Route changes matter here: the web build is output "single", so every screen
// after the first is a client-side navigation. The component listens for those
// itself, which is the reason it is mounted once at the root rather than per
// screen.
export function Analytics() {
  return <VercelAnalytics />;
}
