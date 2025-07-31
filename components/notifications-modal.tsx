"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, CheckCircle, Code, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { markAllNotificationsAsRead, markNotificationAsRead } from "@/lib/actions/notifications";
import { useSession } from "@/lib/auth-client";

interface NotificationItem {
	id: string;
	type: string;
	message: string;
	link: string | null;
	read: boolean;
	createdAt: Date;
}

interface NotificationsModalProps {
	initialUnreadCount: number;
}

export function NotificationsModal({ initialUnreadCount }: NotificationsModalProps) {
	const { data: session, isPending: sessionPending } = useSession();
	const [open, setOpen] = useState(false);
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
	const [loading, setLoading] = useState(false);

	const fetchNotifications = useCallback(async () => {
		if (!session?.user) return;

		setLoading(true);
		try {
			const response = await fetch(`/api/notifications?userId=${session.user.id}`);
			const data = await response.json();
			if (data.notifications) {
				setNotifications(data.notifications.map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) })));
				setUnreadCount(data.unreadCount);
			}
		} catch (error) {
			console.error("Error fetching notifications:", error);
			toast.error("Error al cargar notificaciones.");
		} finally {
			setLoading(false);
		}
	}, [session?.user]);

	useEffect(() => {
		if (open && session?.user) {
			fetchNotifications();
		}
	}, [open, session?.user, fetchNotifications]);

	// Polling for real-time updates (every 30 seconds)
	useEffect(() => {
		if (!session?.user) return;

		const interval = setInterval(() => {
			fetchNotifications();
		}, 60000); // Poll every 60 seconds

		return () => clearInterval(interval);
	}, [session?.user, fetchNotifications]);

	const handleMarkAllAsRead = async () => {
		const result = await markAllNotificationsAsRead();
		if (result.successMessage) {
			toast.success(result.successMessage);
			setNotifications(notifications.map((n) => ({ ...n, read: true })));
			setUnreadCount(0);
		} else {
			toast.error(result.errorMessage || "Error al marcar todas como leídas.");
		}
	};

	const handleNotificationClick = async (notificationId: string) => {
		await markNotificationAsRead(notificationId);
		setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
		setUnreadCount((prev) => Math.max(0, prev - 1));
		setOpen(false); // Close modal before navigating
	};

	if (sessionPending || !session?.user) {
		return null; // Don't render if session is pending or user is not logged in
	}

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button className="relative" size="icon" variant="outline">
					<Bell className="h-5 w-5" />
					{unreadCount > 0 && (
						<span className="-top-1 -right-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-xs">
							{unreadCount}
						</span>
					)}
					<span className="sr-only">Notificaciones</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Bell className="h-6 w-6" />
						Tus Notificaciones
					</DialogTitle>
				</DialogHeader>
				<div className="flex justify-end">
					<Button
						className="text-primary text-sm hover:text-primary/80"
						disabled={unreadCount === 0 || loading}
						onClick={handleMarkAllAsRead}
						size="sm"
						variant="ghost"
					>
						<CheckCircle className="mr-2 h-4 w-4" />
						Marcar todo como leído
					</Button>
				</div>
				<Separator />
				<ScrollArea className="h-[400px] pr-4">
					{loading ? (
						<div className="flex h-full flex-col items-center justify-center text-muted-foreground">
							<Loader2 className="mb-4 h-8 w-8 animate-spin" />
							Cargando notificaciones...
						</div>
					) : notifications.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center text-muted-foreground">
							<Mail className="mb-4 h-12 w-12 opacity-50" />
							<p>No tienes notificaciones nuevas.</p>
							<p className="text-sm">¡Sigue interactuando para recibir actualizaciones!</p>
						</div>
					) : (
						<div className="space-y-4">
							{notifications.map((notification) => (
								<div
									className={`commit-card p-4 ${!notification.read ? "border-primary/20 bg-muted/50" : "bg-card"}`}
									key={notification.id}
								>
									<div className="flex items-start gap-3">
										<div className="flex-shrink-0">
											<Code className="h-5 w-5 text-primary" />
										</div>
										<div className="flex-1">
											<p
												className={`text-sm ${!notification.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}
											>
												{notification.message}
											</p>
											<p className="mt-1 text-muted-foreground text-xs">
												{formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: es })}
											</p>
											{notification.link && (
												<Button
													asChild
													className="mt-1 h-auto p-0 text-blue-400 text-xs hover:text-blue-300"
													onClick={() => handleNotificationClick(notification.id)}
													variant="link"
												>
													<Link href={notification.link} rel="noopener noreferrer">
														Ver detalles
													</Link>
												</Button>
											)}
										</div>
										{!notification.read && (
											<Button
												className="flex-shrink-0 text-primary text-xs hover:text-primary/80"
												onClick={() => handleNotificationClick(notification.id)}
												size="sm"
												variant="ghost" // Mark as read without navigating
											>
												Marcar como leído
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
