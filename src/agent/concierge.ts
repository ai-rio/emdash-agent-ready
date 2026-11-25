import type { Locale } from "../i18n";
import { getContactInfo, getPage, listProjects, searchPortfolio } from "./portfolio";

/**
 * A retrieval-only concierge: it routes a question to the published site
 * content and returns that content. It does not generate text, so it cannot
 * state anything the site does not already say. No model, no memory, no side
 * effects.
 */

const CONTACT =
	/\b(hire|hiring|commission|contact|e-?mail|reach|availab\w*|quote|rates?|pricing|contrat\w*|contato|or[cç]amento|disponib\w*|presupuesto|contacto|correo|trabalhar com|trabajar con)\b/i;
/** Questions about the owner. A bare "about" in "tell me about <topic>" is a search, not this. */
const ABOUT =
	/\b(who are you|who is behind|who is this|about you|about us|about the (studio|owner|team)|what do you do|sobre voc[eê]s?|sobre n[oó]s|quem (é|são|somos)|quem [eé] voc[eê]|qui[eé]nes? (son|eres|sois)|sobre (ti|ustedes)|acerca de (ti|ustedes)|qu[eé] hacen|o que (voc[eê]s )?fazem)\b|^\s*(about|sobre|acerca)\s*\??\s*$/i;
const LIST =
	/\b(list|all|every|todos|todas|lista\w*|projects?|portfolio|portf[oó]lio|projetos?|proyectos?|trabalhos|trabajos|your work|past work|case stud\w*)\b/i;
const GREETING = /^\s*(hi|hello|hey|help|ol[aá]|oi|ajuda|hola|ayuda)\b/i;

const NOTE = "_Answer taken from the published site content; nothing here is generated._\n\n";

const HELP =
	"I can answer from this site's published content. Try:\n" +
	"- \"List your projects\"\n" +
	"- \"Tell me about the Hotel Wilde project\" (or any keyword: packaging, identity, websites)\n" +
	"- \"Who are you?\"\n" +
	"- \"How can I hire you?\"\n\n" +
	"I answer in English, Brazilian Portuguese or Spanish. I cannot send messages or accept work: for that, ask for the contact details and write to the owner.";

export async function respond(origin: string, question: string, locale: Locale): Promise<string> {
	const q = question.trim();

	if (GREETING.test(q) && q.split(/\s+/).length <= 3) return HELP;

	if (CONTACT.test(q)) {
		const a = await getContactInfo(origin, locale);
		return NOTE + a.text;
	}

	if (ABOUT.test(q) && q.split(/\s+/).length <= 8) {
		for (const slug of ["about", "sobre", "acerca-de"]) {
			const a = await getPage(origin, slug, locale);
			if (a.found) return NOTE + a.text;
		}
	}

	const asksForList = LIST.test(q) && q.split(/\s+/).length <= 6;
	if (!asksForList) {
		const found = await searchPortfolio(origin, q, locale, 5);
		if (found.found) return NOTE + found.text;
	}

	const projects = await listProjects(origin, locale);
	if (projects.found && asksForList) return NOTE + projects.text;
	if (projects.found) {
		return `${NOTE}I found nothing matching "${q.slice(0, 80)}". Here are the projects:\n\n${projects.text}`;
	}
	return `${NOTE}${HELP}`;
}

