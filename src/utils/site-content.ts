import type { ContentEntry } from "emdash";
import { getEmDashCollection, getSiteSettings } from "emdash";
import type { Page, Project } from "../../emdash-env";
import { entryPath, localeUrl, slugOf, type Locale } from "../i18n";
import { layoutDescription } from "./page";
import { resolveTagline } from "./tagline";

export interface SiteContent {
	title: string;
	tagline: string | undefined;
	home: ContentEntry<Page> | undefined;
	pages: ContentEntry<Page>[];
	projects: ContentEntry<Project>[];
}

const isHidden = (entry: ContentEntry<Page> | ContentEntry<Project>) =>
	Boolean(
		(entry as { seo?: { noIndex?: boolean } }).seo?.noIndex ??
			(entry.data as { seo?: { noIndex?: boolean } }).seo?.noIndex,
	);

/** Everything published and indexable in one locale (exact locale, no fallback). */
export async function loadSiteContent(locale: Locale): Promise<SiteContent> {
	const [settings, pagesResult, projectsResult] = await Promise.all([
		getSiteSettings(),
		getEmDashCollection("pages", { locale, status: "published", limit: 200 }),
		getEmDashCollection("projects", {
			locale,
			status: "published",
			orderBy: { published_at: "desc" },
			limit: 500,
		}),
	]);
	if (pagesResult.error) throw pagesResult.error;
	if (projectsResult.error) throw projectsResult.error;

	const pages = pagesResult.entries.filter((p) => !isHidden(p));
	return {
		title: settings?.title || "Studio",
		tagline: await resolveTagline(locale, settings?.tagline),
		home: pages.find((p) => slugOf(p.id) === "home"),
		pages: pages.filter((p) => slugOf(p.id) !== "home"),
		projects: projectsResult.entries.filter((p) => !isHidden(p)),
	};
}

export const pageUrl = (origin: string, locale: Locale, page: ContentEntry<Page>) =>
	`${origin}${localeUrl(locale, entryPath("pages", slugOf(page.id)))}`;

export const projectUrl = (
	origin: string,
	locale: Locale,
	project: ContentEntry<Project>,
) => `${origin}${localeUrl(locale, entryPath("projects", slugOf(project.id)))}`;

/** A page's description: its opening block, else the first paragraph of its body. */
export function pageSummary(page: ContentEntry<Page>): string | undefined {
	const fromLayout = layoutDescription(page.data.layout);
	if (fromLayout) return fromLayout;
	const paragraph = page.data.content?.find(
		(block) => block._type === "block" && (block.style ?? "normal") === "normal" && !block.listItem,
	) as { children?: { text?: string }[] } | undefined;
	const text = paragraph?.children?.map((c) => c.text ?? "").join("").replace(/\s+/g, " ").trim();
	if (!text) return undefined;
	return text.length > 200 ? `${text.slice(0, 197).trimEnd()}…` : text;
}
