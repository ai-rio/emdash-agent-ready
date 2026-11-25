import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";
import { Features } from "lightningcss";
import { fileURLToPath } from "node:url";

// i18n: English is the default locale and stays unprefixed. EmDash's admin is
// mounted at /_emdash/admin, so prefixing the default locale would 404 it.
// Other locales are served under /pt-br and /es by re-registering the same
// page files with injectRoute, which avoids duplicating them per locale.
const DEFAULT_LOCALE = "en";
const LOCALES = [DEFAULT_LOCALE, "pt-br", "es"];

const LOCALE_PAGES = [
	["", "./src/pages/index.astro"],
	["/work", "./src/pages/work/index.astro"],
	["/work/[slug]", "./src/pages/work/[slug].astro"],
	["/[slug]", "./src/pages/[slug].astro"],
	["/rss.xml", "./src/pages/rss.xml.ts"],
	["/llms.txt", "./src/pages/llms.txt.ts"],
	["/llms-full.txt", "./src/pages/llms-full.txt.ts"],
];

// Agent-facing endpoints. Registered explicitly because Astro ignores
// dot-prefixed folders under src/pages, and /.well-known/ is dot-prefixed.
const AGENT_ROUTES = [
	["/mcp", "./src/endpoints/mcp.ts"],
	["/.well-known/mcp/server-card.json", "./src/endpoints/server-card.ts"],
	["/.well-known/mcp.json", "./src/endpoints/server-card.ts"],
	["/a2a", "./src/endpoints/a2a.ts"],
	["/.well-known/agent-card.json", "./src/endpoints/agent-card.ts"],
	["/.well-known/api-catalog", "./src/endpoints/api-catalog.ts"],
	["/.well-known/agent-skills/index.json", "./src/endpoints/agent-skills-index.ts"],
	["/.well-known/agent-skills/[skill]/SKILL.md", "./src/endpoints/agent-skill-file.ts"],
];

function localeRoutes() {
	return {
		name: "locale-routes",
		hooks: {
			"astro:config:setup": ({ injectRoute }) => {
				for (const [pattern, entry] of AGENT_ROUTES) {
					injectRoute({
						pattern,
						entrypoint: fileURLToPath(new URL(entry, import.meta.url)),
					});
				}
				for (const locale of LOCALES.filter((l) => l !== DEFAULT_LOCALE)) {
					for (const [suffix, entry] of LOCALE_PAGES) {
						injectRoute({
							pattern: `/${locale}${suffix}`,
							entrypoint: fileURLToPath(new URL(entry, import.meta.url)),
						});
					}
				}
			},
		},
	};
}

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	i18n: {
		defaultLocale: DEFAULT_LOCALE,
		locales: LOCALES,
		fallback: { "pt-br": DEFAULT_LOCALE, es: DEFAULT_LOCALE },
		routing: { prefixDefaultLocale: false },
	},
	// /en/... is not a real route; send it to the unprefixed English URL.
	redirects: {
		"/en": "/",
		"/en/[...path]": "/[...path]",
	},
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	vite: {
		css: {
			// Keep light-dark() native so the footer theme switcher works in
			// production. For older browsers, Lightning CSS otherwise rewrites
			// it into variables that follow only prefers-color-scheme, which the
			// :root.light / :root.dark color-scheme rules in Base.astro can't
			// reach. Browsers without light-dark() get the light fallback in
			// tokens.css.
			lightningcss: { exclude: Features.LightDark },
		},
	},
	integrations: [
		localeRoutes(),
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto", coalesce: true }),
			storage: r2({ binding: "MEDIA" }),
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Host Grotesk",
			cssVariable: "--font-sans",
			weights: [400, 500, 600],
			styles: ["normal", "italic"],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "Fragment Mono",
			cssVariable: "--font-mono",
			weights: [400],
			styles: ["normal"],
			fallbacks: ["monospace"],
		},
	],
	devToolbar: { enabled: false },
});
