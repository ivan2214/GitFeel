"use client";

import { Globe } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Dictionary, Locale } from "@/lib/dictionaries";

/**
 * Props para el componente LanguageSelector
 */
interface LanguageSelectorProps {
	lang: Locale; // Idioma actual
	dict: Dictionary;
}

/**
 * Componente selector de idiomas independiente
 * Permite cambiar entre español e inglés de forma prominente
 */
export function LanguageSelector({ lang }: LanguageSelectorProps) {
	const pathname = usePathname();
	const router = useRouter();

	/**
	 * Función para cambiar el idioma de la aplicación
	 * @param newLang - Nuevo idioma a establecer
	 */
	const changeLanguage = (newLang: Locale) => {
		const currentPath = pathname.replace(`/${lang}`, "");
		router.push(`/${newLang}${currentPath}`);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button className="flex items-center gap-2" size="sm" variant="outline">
					<Globe className="h-4 w-4" />
					<span className="hidden sm:inline">{lang === "es" ? "🇪🇸 Español" : "🇺🇸 English"}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem className={lang === "es" ? "bg-muted" : ""} onClick={() => changeLanguage("es")}>
					🇪🇸 Español
				</DropdownMenuItem>
				<DropdownMenuItem className={lang === "en" ? "bg-muted" : ""} onClick={() => changeLanguage("en")}>
					🇺🇸 English
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
