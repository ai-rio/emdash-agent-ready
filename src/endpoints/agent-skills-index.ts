import type { APIRoute } from "astro";
import { digest, getSkills } from "../agent/skills";

/** /.well-known/agent-skills/index.json (Agent Skills Discovery v0.2.0). */
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const skills = await getSkills(url.origin);
	const index = {
		$schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
		skills: await Promise.all(
			skills.map(async (skill) => ({
				name: skill.name,
				type: "skill-md",
				description: skill.description,
				url: `/.well-known/agent-skills/${skill.name}/SKILL.md`,
				digest: await digest(skill.file),
			})),
		),
	};
	return new Response(JSON.stringify(index, null, 2), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
			"Access-Control-Allow-Origin": "*",
		},
	});
};
