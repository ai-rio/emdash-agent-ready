import type { APIRoute } from "astro";
import { DEFAULT_LOCALE } from "../i18n";
import { loadSiteContent } from "../utils/site-content";

/** A2A Agent Card at /.well-known/agent-card.json (spec v1.0 shape). */
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const { title } = await loadSiteContent(DEFAULT_LOCALE);
	const o = url.origin;
	const card = {
		name: `${title} portfolio concierge`,
		description:
			`Answers questions about ${title}'s projects, pages and how to get in touch, using only the published site content. ` +
			"It is retrieval-based: it quotes the site and does not generate new claims. Read-only: it cannot send messages or accept work.",
		version: "1.0.0",
		supportedInterfaces: [
			{ url: `${o}/a2a`, protocolBinding: "JSONRPC", protocolVersion: "1.0" },
			{ url: `${o}/a2a`, protocolBinding: "JSONRPC", protocolVersion: "0.3" },
		],
		provider: { organization: title, url: o },
		documentationUrl: `${o}/llms.txt`,
		capabilities: { streaming: false, pushNotifications: false },
		defaultInputModes: ["text/plain"],
		defaultOutputModes: ["text/markdown"],
		skills: [
			{
				id: "find-projects",
				name: "Find projects",
				description: "List the published projects, or find the ones that match a keyword, with a short summary and a link for each.",
				tags: ["portfolio", "projects", "search"],
				examples: ["List your projects", "Which projects involve packaging?"],
			},
			{
				id: "about-the-owner",
				name: "About the owner",
				description: "Explain who is behind the site and what they do, quoting the About page.",
				tags: ["about", "services"],
				examples: ["Who are you?", "What do you do?"],
			},
			{
				id: "contact-for-work",
				name: "Contact details for work",
				description: "Give the email address, location and response time for new work. It cannot send messages itself.",
				tags: ["contact", "hire", "availability"],
				examples: ["How can I hire you?"],
			},
		],
	};
	return new Response(JSON.stringify(card, null, 2), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
			"Access-Control-Allow-Origin": "*",
		},
	});
};
