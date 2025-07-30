"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import type { User } from "@/lib/types";

interface NavbarWrapperProps {
	user: User | null;
}

export function NavbarWrapper({ user }: NavbarWrapperProps) {
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
		const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
		return () => clearInterval(interval);
	}, [user]);

	return <Navbar initialUnreadCount={unreadCount} user={user} />;
}
