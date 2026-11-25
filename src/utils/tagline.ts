import { getEmDashEntry } from "emdash";
import { DEFAULT_LOCALE, type Locale } from "../i18n";
import { layoutDescription } from "./page";

/**
 * Site settings are global, so a translated tagline comes from the opening
 * statement of that locale's home page (the same text the default locale's
 * tagline mirrors). An untranslated locale keeps the default tagline.
 */
export async function resolveTagline(
	locale: Locale,
	settingsTagline: string | null | undefined,
): Promise<string | undefined> {
	const fallback = settingsTagline?.trim() || undefined;
	if (locale === DEFAULT_LOCALE) return fallback;
	const { entry, fallbackLocale } = await getEmDashEntry("pages", "home", {
		locale,
	});
	if (!entry || fallbackLocale) return fallback;
	return layoutDescription(entry.data.layout) ?? fallback;
}
