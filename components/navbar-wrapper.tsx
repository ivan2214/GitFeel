"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import type { Locale } from "@/lib/dictionaries";
import type { User } from "@/lib/types";

/**
 * Props para el componente NavbarWrapper
 */
interface NavbarWrapperProps {
	user: User | null;
	dict: any; // Diccionario de traducciones
	lang: Locale; // Idioma actual
}

/**
 * Wrapper del Navbar que maneja el estado de notificaciones no leídas
 * y proporciona las traducciones al componente Navbar
 */
export function NavbarWrapper({ user, dict, lang }: NavbarWrapperProps) {
	const [unreadCount, setUnreadCount] = useState(0);

	useEffect(() => {
		const fetchUnreadCount = async () => {
			if (user) {
				try {
					const response = await fetch(`/api/notifications?userId=${user.id}&take=0`); // Only get count
					const data = await response.json();
					if (data.unreadCount !== undefined) {
						setUnreadCount(data.unreadCount);
					}
				} catch (error) {
					console.error("Error fetching unread count:", error);
				}
			} else {
				setUnreadCount(0);
			}
		};
		fetchUnreadCount();

		// Poll for unread count updates
		const interval = setInterval(fetchUnreadCount, 60000); // Every 60 seconds
		return () => clearInterval(interval);
	}, [user]);

	return <Navbar dict={dict} initialUnreadCount={unreadCount} lang={lang} user={user} />;
}
