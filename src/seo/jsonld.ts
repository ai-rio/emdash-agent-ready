/**
 * schema.org JSON-LD builders. Every node gets a stable @id so the nodes of
 * one page link to each other (and to the same entity on every page).
 * JSON.stringify drops undefined values, so optional fields can be passed
 * through as-is.
 */

export type EntityType = "Organization" | "Person" | "ProfessionalService";
export type WebPageType =
	| "WebPage"
	| "AboutPage"
	| "ContactPage"
	| "CollectionPage";

export type Node = Record<string, unknown>;

export interface Crumb {
	name: string;
	url: string;
}

const iso = (date: Date | null | undefined) => date?.toISOString();

export const entityId = (origin: string) => `${origin}/#entity`;

/** The person or business the whole site is about. Same node on every page. */
export function entityNode(o: {
	origin: string;
	type: EntityType;
	name: string;
	description?: string;
	logo?: string;
	sameAs: string[];
	languages: string[];
}): Node {
	return {
		"@type": o.type,
		"@id": entityId(o.origin),
		name: o.name,
		url: `${o.origin}/`,
		description: o.description,
		...(o.logo ? { logo: o.logo, image: o.logo } : {}),
		...(o.sameAs.length > 0 ? { sameAs: o.sameAs } : {}),
		knowsLanguage: o.languages,
	};
}

export function webPageNode(o: {
	origin: string;
	siteName: string;
	url: string;
	type: WebPageType;
	name: string;
	description?: string;
	inLanguage: string;
	image?: string | null;
	datePublished?: Date | null;
	dateModified?: Date | null;
	hasBreadcrumb: boolean;
}): Node {
	return {
		"@type": o.type,
		"@id": `${o.url}#webpage`,
		url: o.url,
		name: o.name,
		description: o.description,
		inLanguage: o.inLanguage,
		isPartOf: {
			"@type": "WebSite",
			"@id": `${o.origin}/#website`,
			url: `${o.origin}/`,
			name: o.siteName,
		},
		about: { "@id": entityId(o.origin) },
		...(o.image ? { primaryImageOfPage: { "@type": "ImageObject", url: o.image } } : {}),
		datePublished: iso(o.datePublished),
		dateModified: iso(o.dateModified),
		...(o.hasBreadcrumb ? { breadcrumb: { "@id": `${o.url}#breadcrumb` } } : {}),
	};
}

export function breadcrumbNode(url: string, crumbs: Crumb[]): Node {
	return {
		"@type": "BreadcrumbList",
		"@id": `${url}#breadcrumb`,
		itemListElement: crumbs.map((crumb, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: crumb.name,
			item: crumb.url,
		})),
	};
}

/** A portfolio project, as a creative work made by the site's entity. */
export function creativeWorkNode(o: {
	origin: string;
	url: string;
	name: string;
	description?: string;
	image?: string | null;
	inLanguage: string;
	datePublished?: Date | null;
	dateModified?: Date | null;
	keywords: string[];
	client?: string;
	year?: string;
	externalUrl?: string;
}): Node {
	return {
		"@type": "CreativeWork",
		"@id": `${o.url}#work`,
		mainEntityOfPage: { "@id": `${o.url}#webpage` },
		url: o.url,
		name: o.name,
		headline: o.name,
		description: o.description,
		...(o.image ? { image: o.image } : {}),
		inLanguage: o.inLanguage,
		creator: { "@id": entityId(o.origin) },
		datePublished: iso(o.datePublished),
		dateModified: iso(o.dateModified),
		...(o.year ? { copyrightYear: Number(o.year.match(/\d{4}/)?.[0]) || undefined } : {}),
		...(o.keywords.length > 0 ? { keywords: o.keywords.join(", ") } : {}),
		...(o.client ? { sponsor: { "@type": "Organization", name: o.client } } : {}),
		...(o.externalUrl ? { sameAs: o.externalUrl } : {}),
	};
}

/** The work index as an ordered list of project pages. */
export function itemListNode(o: {
	url: string;
	items: { name: string; url: string }[];
}): Node {
	return {
		"@type": "ItemList",
		"@id": `${o.url}#list`,
		mainEntityOfPage: { "@id": `${o.url}#webpage` },
		numberOfItems: o.items.length,
		itemListElement: o.items.map((item, i) => ({
			"@type": "ListItem",
			position: i + 1,
			url: item.url,
			name: item.name,
		})),
	};
}

export function faqNode(o: {
	url: string;
	inLanguage: string;
	items: { question: string; answer: string }[];
}): Node {
	return {
		"@type": "FAQPage",
		"@id": `${o.url}#faq`,
		mainEntityOfPage: { "@id": `${o.url}#webpage` },
		inLanguage: o.inLanguage,
		mainEntity: o.items.map((item) => ({
			"@type": "Question",
			name: item.question,
			acceptedAnswer: { "@type": "Answer", text: item.answer },
		})),
	};
}

/** Serialize for an inline <script>; escaping "<" keeps "</script>" out of the data. */
export function serializeGraph(nodes: Node[]): string {
	return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(
		/</g,
		"\\u003c",
	);
}
