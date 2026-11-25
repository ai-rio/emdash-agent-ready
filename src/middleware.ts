import { defineMiddleware } from "astro:middleware";
import { DEFAULT_LOCALE, isLocale, localeUrl, type Locale } from "./i18n";

/**
 * Send first-time visitors at "/" to their language.
 *
 * Deliberately narrow, because English lives at "/" (unprefixed):
 * - only GET "/" exactly, never deep links (those are shareable as-is);
 * - never for crawlers or tools, so search engines always see the English
 *   home page and the hreflang set;
 * - a `lang` cookie (set by the language switcher) always wins over the
 *   browser's Accept-Language header;
 * - a temporary (302) redirect that varies on the inputs it reads.
 *
 * It also advertises the agent-facing resources on every public HTML page
 * (RFC 8288 Link headers) and marks pages as varying on Accept, because the
 * same URL serves markdown to clients that ask for it.
 */

/** Where an agent can learn what this site offers and how to use it. */
const LINK_HEADER = [
	'</.well-known/api-catalog>; rel="api-catalog"',
	'</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"',
	'</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
	'</llms.txt>; rel="describedby"; type="text/plain"',
].join(", ");

const NOT_A_PERSON =
	/bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|lighthouse|pagespeed|headless|curl|wget|python-requests|node-fetch|undici|go-http|java\//i;

/** First supported language in Accept-Language, honoring q-values. */
function fromAcceptLanguage(header: string): Locale | null {
	const prefs = header
		.split(",")
		.map((part) => {
			const [tag = "", ...params] = part.trim().split(";");
			const q = Number(
				params.find((p) => p.trim().startsWith("q="))?.split("=")[1] ?? 1,
			);
			return { tag: tag.trim().toLowerCase(), q: Number.isNaN(q) ? 0 : q };
		})
		.filter((p) => p.tag && p.tag !== "*" && p.q > 0)
		.sort((a, b) => b.q - a.q);

	for (const { tag } of prefs) {
		const base = tag.split("-")[0];
		if (base === "en") return "en";
		if (base === "pt") return "pt-br";
		if (base === "es") return "es";
	}
	return null;
}

export const onRequest = defineMiddleware(async (context, next) => {
	const isGet = context.request.method === "GET";
	if (!isGet || context.url.pathname !== "/") {
		return decorate(await next(), context.url.pathname, isGet);
	}

	const userAgent = context.request.headers.get("user-agent") ?? "";
	// Every mainstream browser identifies as "Mozilla/…"; scripts and tools rarely do.
	const isPerson = userAgent.startsWith("Mozilla/") && !NOT_A_PERSON.test(userAgent);

	let target: Locale | null = null;
	if (isPerson) {
		const cookie = context.cookies.get("lang")?.value;
		target = isLocale(cookie)
			? cookie
			: fromAcceptLanguage(context.request.headers.get("accept-language") ?? "");
	}

	if (target && target !== DEFAULT_LOCALE) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: localeUrl(target, "/"),
				Vary: "Accept-Language, Cookie, User-Agent",
				"Cache-Control": "private, no-store",
			},
		});
	}

	const response = await next();
	// The English home page was chosen from these inputs too.
	response.headers.append("Vary", "Accept-Language, Cookie, User-Agent");
	return decorate(response, "/", true);
});

/** Add the agent Link header and Vary: Accept to public HTML pages. */
function decorate(response: Response, pathname: string, isGet: boolean): Response {
	if (!isGet || pathname.startsWith("/_emdash")) return response;
	if (!response.headers.get("content-type")?.includes("text/html")) return response;
	response.headers.append("Link", LINK_HEADER);
	response.headers.append("Vary", "Accept");
	return response;
}
