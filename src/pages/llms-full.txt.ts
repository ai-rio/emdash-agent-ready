import type { APIRoute } from "astro";
import { getLocale, localeUrl } from "../i18n";
import { ui } from "../i18n/ui";
import { pageToMarkdown, projectToMarkdown, absolutize } from "../utils/markdown";
import { loadSiteContent, pageUrl, projectUrl } from "../utils/site-content";

/** The whole site as one markdown document, in one locale (see /llms.txt). */
export const prerender = false;

export const GET: APIRoute = async ({ url, currentLocale }) => {
	const locale = getLocale({ currentLocale });
	const tx = ui[locale];
	const origin = url.origin;
	const site = await loadSiteContent(locale);

	const projectLinks = site.projects.map(
		(p) => `- [${p.data.title || tx.untitled}](${projectUrl(origin, locale, p)})`,
	);

	const sections: string[] = [
		`# ${site.title}${site.tagline ? `\n\n> ${site.tagline.replace(/\s+/g, " ").trim()}` : ""}`,
	];
	if (site.home) {
		sections.push(
			`Source: ${origin}${localeUrl(locale, "/")}\n\n${pageToMarkdown(site.home, tx, { projectLinks })}`,
		);
	}
	for (const page of site.pages) {
		sections.push(`Source: ${pageUrl(origin, locale, page)}\n\n${pageToMarkdown(page, tx)}`);
	}
	for (const project of site.projects) {
		sections.push(`Source: ${projectUrl(origin, locale, project)}\n\n${projectToMarkdown(project, tx)}`);
	}

	return new Response(absolutize(sections.join("\n\n---\n\n"), origin) + "\n", {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};
