/**
 * Locale constants and the UI dictionary.
 *
 * Content (pages, projects, menus, taxonomy terms) is translated in the
 * EmDash admin. This file only holds text that belongs to the template:
 * labels, empty states, the 404 page. Keep DEFAULT_LOCALE and LOCALES in
 * sync with the i18n block in astro.config.mjs.
 */

export const DEFAULT_LOCALE = "en" as const;
export const LOCALES = ["en", "pt-br", "es"] as const;
export type Locale = (typeof LOCALES)[number];

/** Value for <html lang>. Astro locale paths are lowercase; BCP 47 is not. */
export const HTML_LANG: Record<Locale, string> = {
	en: "en",
	"pt-br": "pt-BR",
	es: "es",
};

/** Open Graph locale codes (underscore form), for og:locale. */
export const OG_LOCALE: Record<Locale, string> = {
	en: "en_US",
	"pt-br": "pt_BR",
	es: "es_LA",
};

/** Name of each language written in that language, for the switcher. */
export const LOCALE_NAMES: Record<Locale, string> = {
	en: "English",
	"pt-br": "Português",
	es: "Español",
};

const en = {
	skipToContent: "Skip to content",
	mainNav: "Main",
	index: "Index",
	home: "Home",
	follow: "Follow",
	theme: "Theme",
	light: "Light",
	dark: "Dark",
	system: "System",
	language: "Language",
	poweredBy: "Powered by",
	rssFeed: "RSS Feed",

	workTitle: "Work",
	workIntro: "An index of every project, newest first.",
	filterByDiscipline: "Filter by discipline",
	all: "All",
	colNo: "No.",
	colProject: "Project",
	colClient: "Client",
	colDiscipline: "Discipline",
	colYear: "Year",
	untitled: "Untitled",
	moreProjects: "More projects",
	pagination: "Pagination",
	noProjectsYet: "No projects yet",
	viewAllProjects: "View all projects",
	noProjectsFiltered: (label: string) => `No ${label} projects yet`,
	fullIndex: "Full index",
	selectedWork: "Selected work",
	clients: "Clients",

	client: "Client",
	year: "Year",
	website: "Website",
	discipline: "Discipline",
	disciplines: "Disciplines",
	opensInNewTab: "(opens in a new tab)",
	nextProject: "Next project",
	elsewhere: "Elsewhere",
	contentComingSoon: "Content coming soon.",

	notFoundLabel: "Error 404",
	notFoundTitle: "Page not found",
	notFoundText:
		"This page isn’t in the index. It may have moved, or the link may be wrong.",
	backHome: "Back to home",
	browseWork: "Browse the work",
};

export type UiKey = keyof typeof en;
type Dictionary = { [K in UiKey]: (typeof en)[K] };

const ptBr: Dictionary = {
	skipToContent: "Ir para o conteúdo",
	mainNav: "Principal",
	index: "Índice",
	home: "Início",
	follow: "Siga",
	theme: "Tema",
	light: "Claro",
	dark: "Escuro",
	system: "Sistema",
	language: "Idioma",
	poweredBy: "Desenvolvido com",
	rssFeed: "Feed RSS",

	workTitle: "Trabalhos",
	workIntro: "Um índice de todos os projetos, do mais recente ao mais antigo.",
	filterByDiscipline: "Filtrar por disciplina",
	all: "Todos",
	colNo: "Nº",
	colProject: "Projeto",
	colClient: "Cliente",
	colDiscipline: "Disciplina",
	colYear: "Ano",
	untitled: "Sem título",
	moreProjects: "Mais projetos",
	pagination: "Paginação",
	noProjectsYet: "Ainda não há projetos",
	viewAllProjects: "Ver todos os projetos",
	noProjectsFiltered: (label) => `Ainda não há projetos de ${label}`,
	fullIndex: "Índice completo",
	selectedWork: "Trabalhos selecionados",
	clients: "Clientes",

	client: "Cliente",
	year: "Ano",
	website: "Site",
	discipline: "Disciplina",
	disciplines: "Disciplinas",
	opensInNewTab: "(abre em uma nova aba)",
	nextProject: "Próximo projeto",
	elsewhere: "Em outros lugares",
	contentComingSoon: "Conteúdo em breve.",

	notFoundLabel: "Erro 404",
	notFoundTitle: "Página não encontrada",
	notFoundText:
		"Esta página não está no índice. Ela pode ter sido movida ou o link pode estar incorreto.",
	backHome: "Voltar ao início",
	browseWork: "Ver os trabalhos",
};

const es: Dictionary = {
	skipToContent: "Saltar al contenido",
	mainNav: "Principal",
	index: "Índice",
	home: "Inicio",
	follow: "Sígueme",
	theme: "Tema",
	light: "Claro",
	dark: "Oscuro",
	system: "Sistema",
	language: "Idioma",
	poweredBy: "Con tecnología de",
	rssFeed: "Feed RSS",

	workTitle: "Trabajos",
	workIntro: "Un índice de todos los proyectos, del más reciente al más antiguo.",
	filterByDiscipline: "Filtrar por disciplina",
	all: "Todos",
	colNo: "N.º",
	colProject: "Proyecto",
	colClient: "Cliente",
	colDiscipline: "Disciplina",
	colYear: "Año",
	untitled: "Sin título",
	moreProjects: "Más proyectos",
	pagination: "Paginación",
	noProjectsYet: "Aún no hay proyectos",
	viewAllProjects: "Ver todos los proyectos",
	noProjectsFiltered: (label) => `Aún no hay proyectos de ${label}`,
	fullIndex: "Índice completo",
	selectedWork: "Trabajos seleccionados",
	clients: "Clientes",

	client: "Cliente",
	year: "Año",
	website: "Sitio web",
	discipline: "Disciplina",
	disciplines: "Disciplinas",
	opensInNewTab: "(se abre en una pestaña nueva)",
	nextProject: "Siguiente proyecto",
	elsewhere: "En otros lugares",
	contentComingSoon: "Contenido próximamente.",

	notFoundLabel: "Error 404",
	notFoundTitle: "Página no encontrada",
	notFoundText:
		"Esta página no está en el índice. Puede que se haya movido o que el enlace sea incorrecto.",
	backHome: "Volver al inicio",
	browseWork: "Ver los trabajos",
};

export const ui: Record<Locale, Dictionary> = { en, "pt-br": ptBr, es };
