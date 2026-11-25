import type { APIRoute } from "astro";
import { DEFAULT_LOCALE } from "../i18n";
import { loadSiteContent } from "../utils/site-content";

/** MCP Server Card (SEP-2127): lets a client find and describe the MCP server before connecting. */
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const { title, tagline } = await loadSiteContent(DEFAULT_LOCALE);
	const card = {
		serverInfo: { name: `${title} portfolio`, version: "1.0.0" },
		description: `Read-only access to ${title}'s published projects, pages and contact details in English, Portuguese and Spanish.${tagline ? ` ${tagline}` : ""}`,
		url: `${url.origin}/mcp`,
		transport: { type: "streamable-http" },
		capabilities: { tools: true },
	};
	return new Response(JSON.stringify(card, null, 2), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
			"Access-Control-Allow-Origin": "*",
		},
	});
};
