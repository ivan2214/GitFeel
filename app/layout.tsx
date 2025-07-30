import { Inter } from "next/font/google";
import type React from "react";
import "./globals.css";
import { NavbarWrapper } from "@/components/navbar-wrapper";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { createMetadata } from "@/lib/metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata = createMetadata({
	title: {
		default: "gitfeel - Red social para developers",
		template: "%s | gitfeel",
	},
	description:
		"La red social donde los developers comparten sus commits emocionales, frustraciones, logros y dudas de programación.",
	keywords: [
		"developers",
		"programadores",
		"red social",
		"git",
		"commits",
		"código",
		"programación",
	],
});

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="es">
			<body className={inter.className}>
				<ThemeProvider>
					<NavbarWrapper />
					{children}
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}
