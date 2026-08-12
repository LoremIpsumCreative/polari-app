// Vercel Web Analytics — the NATIVE half, which is deliberately nothing.
//
// @vercel/analytics reaches for browser globals and reports to an endpoint the
// web deployment serves. On iOS and Android there is no such endpoint and no
// such globals, so importing it there would ship dead code that throws. The
// metro resolver picks Analytics.web.tsx for the web bundle and this file for
// native, which is the same split fontAssets and LaunchAnimation already use.
//
// Rendering null rather than omitting the component at the call site keeps
// app/_layout.tsx free of a Platform check, so neither half has to remember
// the other exists.
export function Analytics() {
  return null;
}
