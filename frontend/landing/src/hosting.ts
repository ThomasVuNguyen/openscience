import { aliases } from "../../docs/src/navigation"

export type Redirect = { source: string; destination: string }

// Paths that used to be canonical. Real pages (`/download`, `/docs/sessions`,
// `/docs/`) are not listed: Workers `html_handling: drop-trailing-slash` serves
// those extensionless HTML files and redirects the slash and `.html` forms.
const LEGACY: Redirect[] = [
  { source: "/benchmarks", destination: "/benchmark" },
  { source: "/benchmarks/", destination: "/benchmark" },
  { source: "/blog/launch", destination: "/benchmark" },
  { source: "/blog/launch/", destination: "/benchmark" },
  { source: "/legal/privacy", destination: "/privacy" },
  { source: "/legal/privacy/", destination: "/privacy" },
  { source: "/legal/privacy-policy", destination: "/privacy" },
  { source: "/legal/privacy-policy/", destination: "/privacy" },
]

export function permanentRedirects(): Redirect[] {
  return [
    ...LEGACY,
    ...Object.entries(aliases).flatMap(([from, to]) => [
      { source: `/docs/${from}`, destination: `/docs/${to}` },
      { source: `/docs/${from}/`, destination: `/docs/${to}` },
    ]),
  ]
}

// Vercel has no html_handling, so the page trailing-slash rules stay here.
export function vercelRedirects(): Array<Redirect & { permanent: true }> {
  return [
    ...permanentRedirects().map((rule) => ({ ...rule, permanent: true as const })),
    { source: "/:page(download|ace|benchmark|privacy)/", destination: "/:page", permanent: true },
    { source: "/docs/", destination: "/docs", permanent: true },
  ]
}

export function workersRedirectFile(): string {
  const lines = [
    "# Permanent redirects. Keep this in sync with vercel.json via src/hosting.ts.",
    "# Extensionless HTML and trailing slashes on real pages are canonicalized by Workers html_handling.",
    ...permanentRedirects().map((rule) => `${rule.source} ${rule.destination} 308`),
  ]
  return lines.join("\n") + "\n"
}
