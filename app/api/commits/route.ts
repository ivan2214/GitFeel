import type { NextRequest } from "next/server";
import { getCommitsWithForks } from "@/lib/actions/commits";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;

	const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
	const query = searchParams.get("query") || undefined;
	const sortBy = (searchParams.get("sortBy") as "recent" | "popular" | "stars" | "forks") || "recent";
	const offset = Number.parseInt(searchParams.get("offset") || "0");
	const limit = Number.parseInt(searchParams.get("limit") || "20");

	try {
		const { commits, forks } = await getCommitsWithForks({
			tags: tags.length > 0 ? tags : undefined,
			query,
			sortBy,
			limit,
			offset,
		});

		return Response.json({ commits, forks });
	} catch (error) {
		console.error("Error fetching commits:", error);
		return Response.json({ error: "Error fetching commits" }, { status: 500 });
	}
}
