"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface CreateNotificationOptions {
	recipientId: string;
	type: string;
	message: string;
	link?: string;
}

export async function createNotification({ recipientId, type, message, link }: CreateNotificationOptions) {
	try {
		await prisma.notification.create({
			data: {
				userId: recipientId,
				type,
				message,
				link,
			},
		});
		// Revalidate paths that might display notification counts (e.g., navbar)
		revalidatePath("/");
		revalidatePath("/notifications"); // If there's a dedicated notifications page
	} catch (error) {
		console.error("Error creating notification:", error);
	}
}

export async function getNotifications(userId: string, take = 20, skip = 0) {
	try {
		const notifications = await prisma.notification.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			take,
			skip,
		});
		const unreadCount = await prisma.notification.count({
			where: { userId, read: false },
		});
		return { notifications, unreadCount };
	} catch (error) {
		console.error("Error fetching notifications:", error);
		return { notifications: [], unreadCount: 0 };
	}
}

export async function markNotificationAsRead(notificationId: string) {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session?.user) {
			return { errorMessage: "Debes estar autenticado para marcar notificaciones" };
		}

		await prisma.notification.update({
			where: { id: notificationId, userId: session.user.id }, // Ensure user owns the notification
			data: { read: true },
		});
		revalidatePath("/");
		revalidatePath("/notifications");
		return { successMessage: "Notificación marcada como leída" };
	} catch (error) {
		console.error("Error marking notification as read:", error);
		return { errorMessage: "Error al marcar notificación como leída" };
	}
}

export async function markAllNotificationsAsRead() {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session?.user) {
			return { errorMessage: "Debes estar autenticado para marcar notificaciones" };
		}

		await prisma.notification.updateMany({
			where: { userId: session.user.id, read: false },
			data: { read: true },
		});
		revalidatePath("/");
		revalidatePath("/notifications");
		return { successMessage: "Todas las notificaciones marcadas como leídas" };
	} catch (error) {
		console.error("Error marking all notifications as read:", error);
		return { errorMessage: "Error al marcar todas las notificaciones como leídas" };
	}
}
