import type { EntityType } from "./jsonld";

/**
 * What the site is about, for structured data. The name, description, logo
 * and sameAs links come from the site settings (title, tagline, logo,
 * social links), so only the type lives here. Switch to "Person" or
 * "ProfessionalService" when the real content replaces the demo studio.
 */
export const ENTITY_TYPE: EntityType = "Organization";
