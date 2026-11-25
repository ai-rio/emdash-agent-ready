import { DEFAULT_LOCALE, localeUrl, slugOf, type Locale } from "../i18n";
import { ui } from "../i18n/ui";
import { absolutize, pageToMarkdown, projectToMarkdown } from "../utils/markdown";
import {
	loadSiteContent,
	pageUrl,
	projectUrl,
	type SiteContent,
} from "../utils/site-content";

/**
 * The portfolio's public content as answers an agent can use. Shared by the
 * MCP tools and the A2A concierge so both say exactly the same thing.
 * Everything here is already on the public site; nothing writes.
 */

export interface Answer {
	/** False when nothing matched: callers may report an error instead of a result. */
	found: boolean;
	text: string;
}

const oneLine = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const hit = (text: string): Answer => ({ found: true, text });
const miss = (text: string): Answer => ({ found: false, text });

/** The site in `wanted`, or in English when that locale has no such entry. */
async function inLocale<T>(
	wanted: Locale,
	pick: (site: SiteContent, locale: Locale) => T | undefined,
): Promise<{ value: T; locale: Locale } | undefined> {
	for (const candidate of wanted === DEFAULT_LOCALE ? [wanted] : [wanted, DEFAULT_LOCALE]) {
		const value = pick(await loadSiteContent(candidate), candidate);
		if (value !== undefined) return { value, locale: candidate };
	}
	return undefined;
}

const fallbackNote = (wanted: Locale, got: Locale) =>
	wanted === got ? "" : `_Not available in ${wanted}; showing ${got}._\n\n`;

export async function listProjects(origin: string, wanted: Locale): Promise<Answer> {
	const site = await loadSiteContent(wanted);
	if (site.projects.length === 0) {
		return miss(`No projects are published in ${wanted}. Try locale "en".`);
	}
	const tx = ui[wanted];
	return hit(
		site.projects
			.map((p) => {
				const meta = [
					p.data.client,
					p.data.year,
					(p.data.terms?.tag ?? []).map((t) => t.label).join(", "),
				]
					.filter(Boolean)
					.join(" · ");
				return `- **${oneLine(p.data.title) || tx.untitled}** (slug: ${slugOf(p.id)})${meta ? ` — ${meta}` : ""}\n  ${oneLine(p.data.summary)}\n  ${projectUrl(origin, wanted, p)}`;
			})
			.join("\n"),
	);
}

export async function getProject(origin: string, slug: string, wanted: Locale): Promise<Answer> {
	const found = await inLocale(wanted, (site) => site.projects.find((p) => slugOf(p.id) === slug));
	if (!found) return miss(`No project with slug "${slug}". Use list_projects to see them.`);
	const markdown = projectToMarkdown(found.value, ui[found.locale]);
	return hit(
		`${fallbackNote(wanted, found.locale)}Source: ${projectUrl(origin, found.locale, found.value)}\n\n${absolutize(markdown, origin)}`,
	);
}

export async function getPage(origin: string, slug: string, wanted: Locale): Promise<Answer> {
	const found = await inLocale(wanted, (site) =>
		slug === "home" ? site.home : site.pages.find((p) => slugOf(p.id) === slug),
	);
	if (!found) return miss(`No page with slug "${slug}".`);
	const url =
		slug === "home"
			? `${origin}${localeUrl(found.locale, "/")}`
			: pageUrl(origin, found.locale, found.value);
	return hit(
		`${fallbackNote(wanted, found.locale)}Source: ${url}\n\n${absolutize(pageToMarkdown(found.value, ui[found.locale]), origin)}`,
	);
}

/** Words that carry no topic in a question, in the three site languages. */
const STOPWORDS = new Set([
	// English
	..."a an and any anything are as at be by can could do does for from have how i in is it me my of on or show that the their there these this to us want was what when where which who why will with would you your about give find get info information know like look looking more need please see tell details".split(" "),
	// Portuguese
	..."a as com como da das de do dos e ela ele em era essa esse esta este eu foi isso mais mas na nas no nos o os ou para por qual quais que quem se sem seu sua uma um uns você vocês conte fale gostaria informação pode quero saber sobre".split(" "),
	// Spanish
	..."al con cuál cuáles del el ella en es esa ese esta este eso la las lo los muy pero por qué quién se sin su sus un una unos y yo usted ustedes cuéntame dime información más puede quiero quisiera".split(" "),
]);

export async function searchPortfolio(
	origin: string,
	query: string,
	wanted: Locale,
	limit = 5,
): Promise<Answer> {
	const site = await loadSiteContent(wanted);
	const tx = ui[wanted];
	const terms = query
		.toLowerCase()
		.split(/[^\p{L}\p{N}]+/u)
		.filter((t) => t.length > 1 && !STOPWORDS.has(t));
	if (terms.length === 0) return miss(`No searchable words in "${query}".`);
	const docs = [
		...site.projects.map((p) => ({
			title: oneLine(p.data.title) || tx.untitled,
			url: projectUrl(origin, wanted, p),
			body: projectToMarkdown(p, tx),
		})),
		...site.pages.map((p) => ({
			title: oneLine(p.data.title),
			url: pageUrl(origin, wanted, p),
			body: pageToMarkdown(p, tx),
		})),
	];
	const hits = docs
		.map((doc) => {
			const haystack = doc.body.toLowerCase();
			const title = doc.title.toLowerCase();
			let score = 0;
			for (const term of terms) {
				if (title.includes(term)) score += 5;
				score += Math.min(haystack.split(term).length - 1, 5);
			}
			const at = terms.map((t) => haystack.indexOf(t)).find((i) => i >= 0) ?? 0;
			return { doc, score, excerpt: oneLine(doc.body.slice(Math.max(0, at - 60), at + 160)) };
		})
		.filter((h) => h.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit);
	if (hits.length === 0) return miss(`No matches for "${query}" in ${wanted}.`);
	return hit(hits.map((h) => `- **${h.doc.title}** — ${h.doc.url}\n  …${h.excerpt}…`).join("\n"));
}

export async function getContactInfo(origin: string, wanted: Locale): Promise<Answer> {
	const found = await inLocale(wanted, (site) =>
		site.pages.find((p) => p.data.layout?.some((block) => block._type === "portfolio_contact")),
	);
	if (!found) return miss("No contact page is published.");
	return hit(
		`${fallbackNote(wanted, found.locale)}Source: ${pageUrl(origin, found.locale, found.value)}\n\n${absolutize(pageToMarkdown(found.value, ui[found.locale]), origin)}\n\n` +
			"This server cannot send messages. To make contact, write to the email address above.",
	);
}
