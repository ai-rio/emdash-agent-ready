import {
	DEFAULT_LOCALE,
	HTML_LANG,
	LOCALES,
	LOCALE_NAMES,
	OG_LOCALE,
	ui,
	type Locale,
	type UiKey,
} from "./ui";

export { DEFAULT_LOCALE, HTML_LANG, LOCALES, LOCALE_NAMES, OG_LOCALE };
export type { Locale, UiKey };

export function isLocale(value: string | undefined | null): value is Locale {
	return !!value && (LOCALES as readonly string[]).includes(value);
}

/** The locale of the current request; falls back to the default locale. */
export function getLocale(astro: { currentLocale?: string }): Locale {
	return isLocale(astro.currentLocale) ? astro.currentLocale : DEFAULT_LOCALE;
}

/** Look up a UI string. Function entries (with arguments) are called by callers. */
export function t<K extends UiKey>(locale: Locale, key: K) {
	return ui[locale][key];
}

/**
 * Prefix a path with the locale segment. The default locale stays
 * unprefixed because EmDash's admin only works without a default prefix.
 */
export function localeUrl(locale: Locale, path = "/"): string {
	const normalized = path.startsWith("/") ? path : `/${path}`;
	if (locale === DEFAULT_LOCALE) return normalized;
	return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

/** Split a pathname into its locale and the locale-free path. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
	const [, first, ...rest] = pathname.split("/");
	if (isLocale(first) && first !== DEFAULT_LOCALE) {
		return { locale: first, path: `/${rest.join("/")}` };
	}
	return { locale: DEFAULT_LOCALE, path: pathname || "/" };
}

/**
 * EmDash prefixes the entry id with the locale for translations
 * ("pt-br/hotel-wilde"), so build URLs from this, never from entry.id.
 */
export function slugOf(id: string): string {
	const i = id.lastIndexOf("/");
	return i >= 0 ? id.slice(i + 1) : id;
}

/** Public URL path of a content entry, before the locale prefix. */
export function entryPath(collection: string, slug: string): string {
	if (collection === "projects") return `/work/${slug}`;
	if (collection === "pages") return slug === "home" ? "/" : `/${slug}`;
	return `/${slug}`;
}
