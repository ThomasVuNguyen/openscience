# OpenScience documentation

The user documentation at [openscience.sh/docs](https://openscience.sh/docs) is a Vite and React app. Content lives in `src/content/openscience/*.mdx`, and `docs.json` controls five navigation tabs: Guides, Workflows, Explore tools, Skills, and Reference.

## Develop and verify

Run from the repository root with the pinned Bun version:

```bash
bun install --frozen-lockfile
bun run --cwd frontend/docs dev
bun run test:docs
bun run --cwd frontend/docs typecheck
bun run --cwd frontend/docs build
```

The build generates plain-text exports and writes `dist/`. Run `test:docs` to validate content and routing; Fast CI runs these checks before building the docs. Schema and catalog checks use the backend's dependencies, while the hosting build installs only the documentation package and builds the already-checked content.

For browser coverage:

```bash
cd frontend/docs
bunx playwright install chromium
cd ../..
bun run --cwd frontend/docs test:e2e
```

The Playwright suite builds and serves the production app, visits every guide, checks heading anchors and metadata, and exercises redirects, browser history, search, mobile navigation, copy, and exports.

## Write a page

1. Create an MDX file with quoted `title` and `description` frontmatter.
2. Add its filename without the extension to exactly one group in `docs.json`.
3. Use Markdown for headings, tables, examples, and links. The renderer also supports the existing Card/Columns components; arbitrary MDX components are not compiled.
4. Use `/openscience/<page>` links and `/openscience/<page>#<heading>` for sections. A same-page section link is `#<heading>`. Both second- and third-level headings support anchors; the table of contents stays at the second level. Do not use a page name reserved by a legacy alias.
5. Run the checks and inspect the rendered page.

The source map in [documentation-map.md](../../docs/notes/documentation-map.md) identifies the implementation and tests behind each guide. Verify behavior there and through current CLI help before copying an old page's claim.

## Editorial scope

Public pages should explain what a user can do, what setup is required, what an action costs, and how to check or recover its result. Keep service implementation and infrastructure details in the existing engineering documentation.

Document personal provider connections and local models explicitly. Do not imply that account sign-in backs up all research or that a local model makes online tools offline. Distinguish installed instructions from runnable software.

For pricing, verify the public Ace terms and actual account UI. Use current model disclosures for variable rates. Label hypothetical cost examples; never turn an estimate into a price promise.

Show exact UI labels and command names. Mark placeholders in code examples, keep secrets out of examples, and prefer small tasks a reader can verify.

## Generated directories and exports

```bash
bun run --cwd frontend/docs catalog
bun run --cwd frontend/docs check
bun run --cwd frontend/docs export
```

`script/catalog.ts` generates `skill-library.mdx` from all bundled SKILL.md files, `databases.mdx` from the registered scientific database catalog, `tool-catalog.mdx` from all scientific capability manifests, and `ace-models.mdx` from the reviewed managed model roster. Regenerate after changing these inventories; the checker rejects stale output.

`script/check.ts` validates page coverage, redirects, internal links, section anchors, repository file links, and JSON examples against the product configuration or run-event schema.

`script/examples.ts` typechecks every TypeScript example against the current SDK and plugin APIs using virtual source files. It does not run example requests.

`script/export.ts` produces `public/llms.txt` and `public/llms-full.txt`. These are generated during builds and ignored by Git.

## Routes and deployment

Each page is `/docs/<page>`, and a section link adds `#<heading>`. Old page names and hash URLs are mapped in `src/navigation.ts`. An unknown page shows a recoverable not-found view when the app is loaded.

The Vite base is `/docs/`. The landing site build copies this output to `dist/docs` and publishes the site and the docs together on Cloudflare Workers (or the existing Vercel project). A documentation change does not have its own production deployment. See the landing README.
