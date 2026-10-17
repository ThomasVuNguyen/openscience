import { describe, expect, test } from "bun:test"
import { aliases } from "../src/navigation"
import { permanentRedirects, vercelRedirects, workersRedirectFile } from "../../landing/src/hosting"

const landing = new URL("../../landing/", import.meta.url)

describe("cloudflare hosting", () => {
  test("workers and vercel publish the same permanent redirects", async () => {
    const vercel = (await Bun.file(new URL("vercel.json", landing)).json()) as {
      redirects: Array<{ source: string; destination: string; permanent: boolean }>
    }
    expect(vercel.redirects).toEqual(vercelRedirects())
    expect(await Bun.file(new URL("public/_redirects", landing)).text()).toBe(workersRedirectFile())
    const headers = await Bun.file(new URL("public/_headers", landing)).text()
    expect(headers).toContain("/install\n  Content-Type: text/plain; charset=utf-8")
    expect(headers).toContain("/install-desktop\n  Content-Type: text/plain; charset=utf-8")
  })

  test("every renamed docs page redirects on the edge, including the trailing slash", () => {
    const rules = permanentRedirects()
    for (const [from, to] of Object.entries(aliases)) {
      expect(rules).toContainEqual({ source: `/docs/${from}`, destination: `/docs/${to}` })
      expect(rules).toContainEqual({ source: `/docs/${from}/`, destination: `/docs/${to}` })
    }
  })

  test("real pages stay on html handling instead of a second redirect", () => {
    const sources = new Set(permanentRedirects().map((rule) => rule.source))
    for (const path of ["/download", "/ace", "/benchmark", "/privacy", "/docs"]) {
      expect(sources.has(path)).toBe(false)
      expect(sources.has(`${path}/`)).toBe(false)
      expect(sources.has(`${path}.html`)).toBe(false)
    }
  })

  test("the site worker canonicalizes html and serves the prerendered 404", async () => {
    const config = parseJsonc(await Bun.file(new URL("wrangler.jsonc", landing)).text()) as {
      name: string
      assets: { directory: string; html_handling: string; not_found_handling: string }
    }
    expect(config.name).toBe("openscience-site")
    expect(config.assets.directory).toBe("./dist")
    expect(config.assets.html_handling).toBe("drop-trailing-slash")
    expect(config.assets.not_found_handling).toBe("404-page")
  })

  test("the workspace worker is a single-page app", async () => {
    const config = parseJsonc(await Bun.file(new URL("../../workspace/wrangler.jsonc", import.meta.url)).text()) as {
      name: string
      assets: { directory: string; not_found_handling: string }
    }
    expect(config.name).toBe("openscience-workspace")
    expect(config.assets.directory).toBe("./dist")
    expect(config.assets.not_found_handling).toBe("single-page-application")
  })
})

function parseJsonc(text: string): unknown {
  return JSON.parse(
    text
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/,(\s*[}\]])/g, "$1"),
  )
}
