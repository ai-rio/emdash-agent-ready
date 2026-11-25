import type { APIRoute } from "astro";

/**
 * Policy: search and answer engines are welcome, AI training is not.
 * Content signals (https://contentsignals.org): search=yes, ai-input=yes,
 * ai-train=no. Crawlers follow robots.txt voluntarily; it is a statement of
 * policy, not enforcement. Replaces EmDash's default route (see
 * https://docs.emdashcms.com/guides/seo).
 *
 * A crawler that matches a specific group ignores the "*" group, so the
 * admin disallow is repeated in every allowing group.
 */
export const prerender = false;

const SIGNAL = "Content-Signal: search=yes, ai-input=yes, ai-train=no";

/** Fetch pages to answer a user or to build a search index: allowed. */
const ANSWER_AND_SEARCH_BOTS = [
	"OAI-SearchBot",
	"ChatGPT-User",
	"Claude-SearchBot",
	"Claude-User",
	"PerplexityBot",
	"Perplexity-User",
];

/** Collect pages for model training: disallowed (list from Cloudflare's managed robots.txt). */
const TRAINING_BOTS = [
	"GPTBot",
	"ClaudeBot",
	"Google-Extended",
	"Applebot-Extended",
	"CCBot",
	"Bytespider",
	"meta-externalagent",
	"Amazonbot",
];

export const GET: APIRoute = ({ url }) => {
	const lines = [
		"# Search and answer engines are welcome. AI training is not.",
		"# Policy: search=yes, ai-input=yes, ai-train=no (https://contentsignals.org)",
		"",
		"User-agent: *",
		SIGNAL,
		"Allow: /",
		"Disallow: /_emdash/",
		"",
		"# AI search and answer crawlers",
		...ANSWER_AND_SEARCH_BOTS.map((bot) => `User-agent: ${bot}`),
		SIGNAL,
		"Allow: /",
		"Disallow: /_emdash/",
		"",
		"# AI training crawlers",
		"# (Google-Extended and Applebot-Extended are opt-out tokens: Googlebot and",
		"# Applebot keep crawling for search.)",
		...TRAINING_BOTS.map((bot) => `User-agent: ${bot}`),
		"Disallow: /",
		"",
		`Sitemap: ${url.origin}/sitemap.xml`,
		"",
	];

	return new Response(lines.join("\n"), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};
