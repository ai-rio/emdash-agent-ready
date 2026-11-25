import type { APIRoute } from "astro";
import { getEmDashCollection, getTranslations } from "emdash";
import {
	DEFAULT_LOCALE,
	HTML_LANG,
	LOCALES,
	entryPath,
	isLocale,
	localeUrl,
	slugOf,
	type Locale,
} from "../i18n";

/**
 * One sitemap for the whole site. EmDash's per-collection sitemaps list the
 * home page as /home and leave out the static routes (/work), so this
 * replaces them: every locale, hreflang alternates, noindex entries left out.
 */

export const prerender = false;

type Collection = "pages" | "projects";
interface Variant {
	locale: Locale;
	path: string;
}
interface Entry {
	collection: Collection;
	dbId: string;
	locale: Locale;
	slug: string;
	updatedAt?: Date;
}

const COLLECTIONS: Collection[] = ["pages", "projects"];

function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export const GET: APIRoute = async ({ url }) => {
	const origin = url.origin;
	const abs = (path: string) => `${origin}${path}`;

	// 1. Every published, indexable entry in every locale.
	const entries: Entry[] = [];
	for (const collection of COLLECTIONS) {
		for (const locale of LOCALES) {
			const result = await getEmDashCollection(collection, {
				locale,
				status: "published",
				limit: 1000,
			});
			if (result.error) {
				return new Response("Could not build the sitemap", { status: 500 });
			}
			for (const entry of result.entries) {
				const seo = (entry as { seo?: { noIndex?: boolean } }).seo ??
					(entry.data as { seo?: { noIndex?: boolean } }).seo;
				if (seo?.noIndex) continue;
				entries.push({
					collection,
					dbId: entry.data.id,
					locale,
					slug: slugOf(entry.id),
					updatedAt: entry.data.updatedAt,
				});
			}
		}
	}

	// 2. Group translations once per entry so each URL lists its alternates.
	const alternatesById = new Map<string, Variant[]>();
	for (const entry of entries) {
		if (alternatesById.has(entry.dbId)) continue;
		const { translations } = await getTranslations(entry.collection, entry.dbId);
		const variants = translations
			.filter((t) => t.status === "published" && t.slug && isLocale(t.locale))
			.map((t) => ({
				locale: t.locale as Locale,
				path: localeUrl(t.locale as Locale, entryPath(entry.collection, t.slug!)),
			}));
		for (const t of translations) alternatesById.set(t.id, variants);
		alternatesById.set(entry.dbId, variants);
	}

	const urls: string[] = [];
	const addUrl = (loc: string, alternates: Variant[], lastmod?: Date) => {
		const sorted = [...alternates].sort(
			(a, b) => LOCALES.indexOf(a.locale) - LOCALES.indexOf(b.locale),
		);
		const links =
			sorted.length > 1
				? [
						...sorted.map(
							(v) =>
								`    <xhtml:link rel="alternate" hreflang="${HTML_LANG[v.locale]}" href="${escapeXml(abs(v.path))}" />`,
						),
						`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(
							abs((sorted.find((v) => v.locale === DEFAULT_LOCALE) ?? sorted[0]!).path),
						)}" />`,
					]
				: [];
		urls.push(
			[
				"  <url>",
				`    <loc>${escapeXml(loc)}</loc>`,
				lastmod ? `    <lastmod>${lastmod.toISOString()}</lastmod>` : "",
				...links,
				"  </url>",
			]
				.filter(Boolean)
				.join("\n"),
		);
	};

	// 3. Entry pages.
	for (const entry of entries) {
		const path = localeUrl(entry.locale, entryPath(entry.collection, entry.slug));
		addUrl(abs(path), alternatesById.get(entry.dbId) ?? [], entry.updatedAt);
	}

	// 4. The work index exists in a locale only when that locale has projects.
	const workLocales = LOCALES.filter(
		(locale) =>
			locale === DEFAULT_LOCALE ||
			entries.some((e) => e.collection === "projects" && e.locale === locale),
	);
	const workVariants = workLocales.map((locale) => ({
		locale,
		path: localeUrl(locale, "/work"),
	}));
	for (const variant of workVariants) addUrl(abs(variant.path), workVariants);

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};
