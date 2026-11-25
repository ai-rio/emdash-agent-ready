import type { ContentEntry } from "emdash";
import { portableTextToMarkdown } from "emdash/client";
import type { Page, PageLayoutBlock, Project } from "../../emdash-env";
import type { ui } from "../i18n/ui";

/**
 * Markdown renderings of the site's content, for llms.txt / llms-full.txt and
 * for agents that ask for text/markdown. Plain content in, plain markdown
 * out: no HTML, no scripts, absolute URLs only.
 */

type Dictionary = (typeof ui)[keyof typeof ui];

/** Make site-relative links and image sources absolute. */
export function absolutize(markdown: string, origin: string): string {
	return markdown.replace(/\]\((\/[^)]*)\)/g, (_m, path) => `](${origin}${path})`);
}

function oneLine(text: string | null | undefined): string {
	return (text ?? "").replace(/\s+/g, " ").trim();
}

/** A page's layout blocks as markdown. Selected-work blocks are listed by the caller. */
export function layoutToMarkdown(
	layout: readonly PageLayoutBlock[] | null | undefined,
	tx: Dictionary,
	options: { projectLinks?: string[] } = {},
): string {
	const parts: string[] = [];
	for (const block of layout ?? []) {
		switch (block._type) {
			case "portfolio_statement":
				if (block.label) parts.push(`*${oneLine(block.label)}*`);
				parts.push(oneLine(block.text));
				break;
			case "portfolio_selected_work":
				parts.push(`## ${oneLine(block.heading)}`);
				if (options.projectLinks?.length) parts.push(options.projectLinks.join("\n"));
				break;
			case "portfolio_clients":
				parts.push(
					`## ${oneLine(block.heading)}`,
					block.clients.map((c) => c.name).join(", "),
				);
				break;
			case "portfolio_contact": {
				parts.push(`## ${oneLine(block.heading)}`);
				if (block.intro) parts.push(oneLine(block.intro));
				const facts: string[] = [];
				if (block.email) {
					facts.push(`- ${oneLine(block.email_label) || "Email"}: ${block.email}`);
				}
				for (const d of block.details ?? []) {
					facts.push(
						`- ${oneLine(d.label)}: ${oneLine(d.text)}${d.note ? ` (${oneLine(d.note)})` : ""}`,
					);
				}
				if (facts.length) parts.push(facts.join("\n"));
				break;
			}
			case "portfolio_faq":
				parts.push(
					`## ${oneLine(block.heading)}`,
					(block.items ?? [])
						.map((item) => `### ${oneLine(item.question)}\n\n${oneLine(item.answer)}`)
						.join("\n\n"),
				);
				break;
			default:
				// Block types added later get their own case; unknown ones are
				// skipped rather than guessed at.
				break;
		}
	}
	return parts.join("\n\n");
}

export function pageToMarkdown(
	page: ContentEntry<Page>,
	tx: Dictionary,
	options: { projectLinks?: string[] } = {},
): string {
	const layout = layoutToMarkdown(page.data.layout, tx, options);
	const body = page.data.content?.length
		? portableTextToMarkdown(page.data.content)
		: "";
	const parts = [`# ${oneLine(page.data.title)}`];
	if (body) parts.push(body);
	if (layout) parts.push(layout);
	return parts.join("\n\n");
}

export function projectToMarkdown(project: ContentEntry<Project>, tx: Dictionary): string {
	const d = project.data;
	const facts: string[] = [];
	if (d.client) facts.push(`- ${tx.client}: ${oneLine(d.client)}`);
	if (d.year) facts.push(`- ${tx.year}: ${oneLine(d.year)}`);
	const disciplines = (d.terms?.tag ?? []).map((t) => t.label);
	if (disciplines.length) {
		facts.push(
			`- ${disciplines.length === 1 ? tx.discipline : tx.disciplines}: ${disciplines.join(", ")}`,
		);
	}
	if (d.url) facts.push(`- ${tx.website}: ${d.url}`);

	const parts = [`# ${oneLine(d.title) || tx.untitled}`];
	if (d.summary) parts.push(oneLine(d.summary));
	if (facts.length) parts.push(facts.join("\n"));
	if (d.content?.length) parts.push(portableTextToMarkdown(d.content));
	return parts.join("\n\n");
}
