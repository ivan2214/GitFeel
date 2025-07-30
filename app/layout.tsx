import type React from "react";
import "./globals.css";
import { createMetadata } from "@/lib/metadata";

/**
 * Metadata básica para la aplicación
 * Las páginas específicas de idioma tendrán su propia metadata
 */
export const metadata = createMetadata({
	title: {
		default: "gitfeel - Red social para developers",
		template: "%s | gitfeel",
	},
	description: "La red social donde los developers comparten sus commits emocionales, frustraciones, logros y dudas de programación.",
	keywords: ["developers", "programadores", "red social", "git", "commits", "código", "programación"],
});

/**
 * Layout raíz de la aplicación
 * Solo proporciona la estructura HTML básica
 * El contenido real se maneja en los layouts de idiomas específicos
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
	return children;
}
