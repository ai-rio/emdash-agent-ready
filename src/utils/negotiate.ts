/**
 * Markdown content negotiation. A request gets markdown only when it lists
 * text/markdown itself (not via a wildcard) with a quality at least as high
 * as text/html, so browsers, which send text/html first, always get HTML.
 */

export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=no";

function quality(accept: string, type: string): number | null {
	for (const part of accept.split(",")) {
		const [range = "", ...params] = part.trim().split(";");
		if (range.trim().toLowerCase() !== type) continue;
		const q = params.find((p) => p.trim().startsWith("q="));
		const value = q ? Number(q.split("=")[1]) : 1;
		return Number.isNaN(value) ? 0 : value;
	}
	return null;
}

export function wantsMarkdown(request: Request): boolean {
	const accept = request.headers.get("accept") ?? "";
	const markdown = quality(accept, "text/markdown");
	if (markdown === null || markdown <= 0) return false;
	const html = quality(accept, "text/html");
	return html === null || markdown >= html;
}

/** Rough token estimate (about four characters per token), as a size hint for agents. */
const estimateTokens = (text: string) => Math.ceil(text.length / 4);

export function markdownResponse(markdown: string): Response {
	const body = markdown.endsWith("\n") ? markdown : `${markdown}\n`;
	return new Response(body, {
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			Vary: "Accept",
			"Content-Signal": CONTENT_SIGNAL,
			"X-Markdown-Tokens": String(estimateTokens(body)),
			"Cache-Control": "public, max-age=300",
		},
	});
}
