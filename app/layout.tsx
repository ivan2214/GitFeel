import { Inter } from "next/font/google";
import type React from "react";
import "./globals.css";
import { NavbarWrapper } from "@/components/navbar-wrapper";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/data/user";
import { createMetadata } from "@/lib/metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata = createMetadata({
	title: {
		default: "gitfeel - Red social para developers",
		template: "%s | gitfeel",
	},
	description: "La red social donde los developers comparten sus commits emocionales, frustraciones, logros y dudas de programación.",
	keywords: ["developers", "programadores", "red social", "git", "commits", "código", "programación"],
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const user = await getCurrentUser();
	return (
		<html lang="es" suppressHydrationWarning>
			<body className={inter.className}>
				<ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
					<NavbarWrapper user={user} />
					{children}
					<Toaster position="top-right" richColors />
				</ThemeProvider>
			</body>
		</html>
	);
}
