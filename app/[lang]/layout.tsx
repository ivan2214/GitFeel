import { Inter } from "next/font/google";
import type React from "react";
import "../globals.css";
import type { Metadata } from "next";
import { NavbarWrapper } from "@/components/navbar-wrapper";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/data/user";
import { getDictionary, type Locale, locales } from "@/lib/dictionaries";

const inter = Inter({ subsets: ["latin"] });

/**
 * Genera los parámetros estáticos para todas las rutas de idiomas
 * Esto permite la generación estática de las páginas para cada idioma
 */
export async function generateStaticParams() {
	return locales.map((locale) => ({ lang: locale }));
}

/**
 * Genera metadata dinámica basada en el idioma
 * @param params - Parámetros de la ruta incluyendo el idioma
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }): Promise<Metadata> {
	const { lang } = await params;
	const dict = await getDictionary(lang);

	return {
		title: {
			default: dict.meta.title,
			template: `%s | gitfeel`,
		},
		description: dict.meta.description,
		keywords: dict.meta.keywords.split(", "),
		openGraph: {
			title: dict.meta.title,
			description: dict.meta.description,
			type: "website",
			locale: lang === "es" ? "es_ES" : "en_US",
			alternateLocale: lang === "es" ? "en_US" : "es_ES",
		},
		twitter: {
			card: "summary_large_image",
			title: dict.meta.title,
			description: dict.meta.description,
		},
		alternates: {
			languages: {
				es: "/es",
				en: "/en",
			},
		},
	};
}

/**
 * Layout principal para las rutas con idiomas
 * Proporciona el contexto de idioma a todos los componentes hijos
 */
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: Locale }> }) {
	const { lang } = await params;
	const user = await getCurrentUser();
	const dict = await getDictionary(lang);

	return (
		<html lang={lang} suppressHydrationWarning>
			<body className={inter.className}>
				<ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
					<NavbarWrapper dict={dict} lang={lang} user={user} />
					{children}
					<Toaster position="top-right" richColors />
				</ThemeProvider>
			</body>
		</html>
	);
}
