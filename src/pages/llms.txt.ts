import type { APIRoute } from "astro";
import { LOCALES, LOCALE_NAMES, getLocale, localeUrl } from "../i18n";
import { ui } from "../i18n/ui";
import {
	loadSiteContent,
	pageSummary,
	pageUrl,
	projectUrl,
} from "../utils/site-content";

/**
 * llms.txt (https://llmstxt.org): a short markdown map of the site for
 * language models, one per locale. The link list is the contract; the full
 * text lives in /llms-full.txt.
 */
export const prerender = false;

const oneLine = (text: string | null | undefined) =>
	(text ?? "").replace(/\s+/g, " ").trim();

export const GET: APIRoute = async ({ url, currentLocale }) => {
	const locale = getLocale({ currentLocale });
	const tx = ui[locale];
	const origin = url.origin;
	const site = await loadSiteContent(locale);

	const lines: string[] = [`# ${site.title}`, ""];
	if (site.tagline) lines.push(`> ${oneLine(site.tagline)}`, "");

	lines.push(`## ${tx.index}`, "");
	lines.push(`- [${tx.home}](${origin}${localeUrl(locale, "/")})`);
	if (site.projects.length > 0) {
		lines.push(`- [${tx.workTitle}](${origin}${localeUrl(locale, "/work")}): ${oneLine(tx.workIntro)}`);
	}
	for (const page of site.pages) {
		const summary = oneLine(pageSummary(page));
		lines.push(`- [${oneLine(page.data.title)}](${pageUrl(origin, locale, page)})${summary ? `: ${summary}` : ""}`);
	}

	if (site.projects.length > 0) {
		lines.push("", `## ${tx.workTitle}`, "");
		for (const project of site.projects) {
			const summary = oneLine(project.data.summary);
			lines.push(
				`- [${oneLine(project.data.title) || tx.untitled}](${projectUrl(origin, locale, project)})${summary ? `: ${summary}` : ""}`,
			);
		}
	}

	lines.push("", `## ${tx.language}`, "");
	for (const l of LOCALES) {
		lines.push(`- [${LOCALE_NAMES[l]}](${origin}${localeUrl(l, "/llms.txt")})`);
	}

	lines.push(
		"",
		"## Optional",
		"",
		`- [Full content in one file](${origin}${localeUrl(locale, "/llms-full.txt")})`,
		`- [Sitemap](${origin}/sitemap.xml)`,
		"",
	);

	return new Response(lines.join("\n"), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};
