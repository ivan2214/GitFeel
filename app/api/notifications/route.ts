import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { getNotifications } from "@/lib/actions/notifications";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session?.user) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}

		const searchParams = request.nextUrl.searchParams;
		const take = Number.parseInt(searchParams.get("take") || "20");
		const skip = Number.parseInt(searchParams.get("skip") || "0");

		const { notifications, unreadCount } = await getNotifications(session.user.id, take, skip);

		return Response.json({ notifications, unreadCount });
	} catch (error) {
		console.error("Error fetching notifications API:", error);
		return Response.json({ error: "Error fetching notifications" }, { status: 500 });
	}
}
