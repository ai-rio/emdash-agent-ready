import type { APIRoute } from "astro";

/** /.well-known/api-catalog (RFC 9727): the site's APIs as an RFC 9264 linkset. */
export const prerender = false;

export const GET: APIRoute = ({ url }) => {
	const o = url.origin;
	const catalog = {
		linkset: [
			{
				anchor: `${o}/mcp`,
				"service-desc": [
					{ href: `${o}/.well-known/mcp/server-card.json`, type: "application/json" },
				],
				"service-doc": [
					{ href: `${o}/.well-known/agent-skills/index.json`, type: "application/json" },
					{ href: `${o}/llms.txt`, type: "text/plain" },
				],
			},
			{
				anchor: `${o}/a2a`,
				"service-desc": [
					{ href: `${o}/.well-known/agent-card.json`, type: "application/json" },
				],
				"service-doc": [{ href: `${o}/llms.txt`, type: "text/plain" }],
			},
		],
	};
	return new Response(JSON.stringify(catalog, null, 2), {
		headers: {
			"Content-Type": 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
			"Cache-Control": "public, max-age=3600",
			"Access-Control-Allow-Origin": "*",
		},
	});
};
