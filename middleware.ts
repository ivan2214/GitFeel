import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { defaultLocale, type Locale, locales } from "@/lib/dictionaries";

/**
 * Obtiene el idioma preferido del usuario basado en los headers de la request
 * @param request - La request de Next.js
 * @returns El idioma preferido del usuario
 */
function getLocale(request: NextRequest): Locale {
	// Obtener el header Accept-Language
	const acceptLanguage = request.headers.get("accept-language");

	if (!acceptLanguage) {
		return defaultLocale;
	}

	try {
		// Usar Negotiator para parsear los idiomas preferidos
		const headers = { "accept-language": acceptLanguage };
		const languages = new Negotiator({ headers }).languages();

		// Usar intl-localematcher para encontrar la mejor coincidencia
		return match(languages, locales, defaultLocale) as Locale;
	} catch (error) {
		console.warn("Error al detectar idioma:", error);
		return defaultLocale;
	}
}

/**
 * Middleware para manejar la internacionalización
 * Redirige automáticamente a la ruta con el idioma apropiado
 */
export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Verificar si la ruta ya tiene un idioma
	const pathnameHasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);

	// Si ya tiene idioma, continuar
	if (pathnameHasLocale) {
		console.log("La ruta ya tiene idioma:", pathname);

		return NextResponse.next();
	}
	console.log("La ruta no tiene idioma:", pathname);

	// Obtener el idioma preferido del usuario
	const locale = getLocale(request);

	// Construir la nueva URL con el idioma
	const newUrl = new URL(`/${locale}${pathname}`, request.url);

	// Preservar los query parameters
	newUrl.search = request.nextUrl.search;

	// Redirigir a la nueva URL
	return NextResponse.redirect(newUrl);
}

/**
 * Configuración del middleware
 * Define en qué rutas debe ejecutarse
 */
export const config = {
	matcher: [
		// Excluir archivos internos de Next.js y archivos estáticos
		"/((?!_next|api|favicon.ico|.*\\.).*)",
	],
};
