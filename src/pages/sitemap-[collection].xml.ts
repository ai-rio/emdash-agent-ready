import type { APIRoute } from "astro";

/**
 * EmDash's per-collection sitemaps list the home page as /home and know
 * nothing about the locale-aware work index. /sitemap.xml replaces them, so
 * anything that still requests one is sent there.
 */
export const prerender = false;

export const GET: APIRoute = ({ redirect }) => redirect("/sitemap.xml", 301);
