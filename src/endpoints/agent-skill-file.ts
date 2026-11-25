import type { APIRoute } from "astro";
import { getSkills } from "../agent/skills";

/** /.well-known/agent-skills/[skill]/SKILL.md */
export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
	const skills = await getSkills(url.origin);
	const skill = skills.find((s) => s.name === params.skill);
	if (!skill) return new Response("Not found", { status: 404 });
	return new Response(skill.file, {
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
			"Access-Control-Allow-Origin": "*",
		},
	});
};
