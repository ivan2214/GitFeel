import "server-only";

/**
 * Tipo que define los idiomas soportados por la aplicación
 */
export type Locale = "es" | "en";

/**
 * Diccionarios disponibles para cada idioma
 * Utiliza importación dinámica para optimizar el bundle
 */
const dictionaries = {
	es: () => import("@/dictionaries/es.json").then((module) => module.default),
	en: () => import("@/dictionaries/en.json").then((module) => module.default),
};

/**
 * Obtiene el diccionario de traducciones para el idioma especificado
 * @param locale - El idioma para el cual obtener las traducciones
 * @returns Promise que resuelve al diccionario de traducciones
 */
export const getDictionary = async (locale: Locale) => {
	return dictionaries[locale]();
};

/**
 * Lista de idiomas soportados por la aplicación
 */
export const locales: Locale[] = ["es", "en"];

/**
 * Idioma por defecto de la aplicación
 */
export const defaultLocale: Locale = "es";

/**
 * Verifica si un idioma es válido
 * @param locale - El idioma a verificar
 * @returns true si el idioma es válido, false en caso contrario
 */
export const isValidLocale = (locale: string): locale is Locale => {
	return locales.includes(locale as Locale);
};

/**
 * Obtiene el idioma preferido del usuario basado en los headers de la request
 * @param acceptLanguage - Header Accept-Language de la request
 * @returns El idioma preferido del usuario o el idioma por defecto
 */
export const getPreferredLocale = (acceptLanguage: string | null): Locale => {
	if (!acceptLanguage) return defaultLocale;

	// Parsear el header Accept-Language
	const languages = acceptLanguage
		.split(",")
		.map((lang) => {
			const [code, q = "1"] = lang.trim().split(";q=");
			return { code: code.toLowerCase(), quality: parseFloat(q) };
		})
		.sort((a, b) => b.quality - a.quality);

	// Buscar el primer idioma soportado
	for (const { code } of languages) {
		// Verificar idioma exacto (ej: 'es', 'en')
		if (isValidLocale(code)) {
			return code;
		}

		// Verificar idioma base (ej: 'es-ES' -> 'es')
		const baseCode = code.split("-")[0];
		if (isValidLocale(baseCode)) {
			return baseCode;
		}
	}

	return defaultLocale;
};
