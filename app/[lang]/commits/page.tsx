import { Code, TrendingUp } from "lucide-react";
import { AdvancedSearch } from "@/components/advanced-search";
import { InfiniteCommits } from "@/components/infinite-commits";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/data/user";
import { getCommitsWithForks } from "@/lib/actions/commits";
import prisma from "@/lib/prisma";

interface CommitsPageProps {
	searchParams: Promise<{
		tags?: string;
		query?: string;
		sortBy?: string;
	}>;
}

async function getAllTags() {
	return await prisma.tag.findMany({
		include: {
			_count: {
				select: {
					commits: true,
				},
			},
		},
		orderBy: {
			commits: {
				_count: "desc",
			},
		},
		take: 50,
	});
}

export default async function CommitsPage({ searchParams }: CommitsPageProps) {
	const user = await getCurrentUser();

	const tags = (await searchParams).tags?.split(",").filter(Boolean) || [];
	const { commits, forks } = await getCommitsWithForks({
		tags: tags.length > 0 ? tags : undefined,
		query: (await searchParams).query,
		sortBy: ((await searchParams).sortBy as any) || "recent",
		limit: 20,
		offset: 0,
	});

	const allTags = await getAllTags();

	const getSortLabel = (sortBy: string) => {
		switch (sortBy) {
			case "popular":
				return "Más populares";
			case "stars":
				return "Más estrellas";
			case "forks":
				return "Más forks";
			default:
				return "Más recientes";
		}
	};

	const totalResults = commits.length + forks.length;

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
					{/* Search Sidebar */}
					<div className="space-y-6">
						<AdvancedSearch allTags={allTags} />
					</div>

					{/* Main Content */}
					<div className="space-y-6 lg:col-span-3">
						{/* Header */}
						<Card className="commit-card">
							<div className="commit-header">
								<Code className="h-3 w-3" />
								<span>explorar commits</span>
								<span className="ml-auto flex items-center gap-1">
									<TrendingUp className="h-3 w-3" />
									{getSortLabel((await searchParams).sortBy || "recent")}
								</span>
							</div>
							<CardContent className="p-4">
								<h1 className="mb-2 font-bold text-2xl">Explorar Sentimientos de Developers</h1>
								<p className="text-muted-foreground">
									{(await searchParams).tags || (await searchParams).query
										? `${totalResults} resultados encontrados`
										: `Descubre lo que piensan y sienten los developers de todo el mundo`}
								</p>

								{/* Active Filters Summary */}
								{((await searchParams).tags || (await searchParams).query) && (
									<div className="mt-3 rounded-lg bg-muted/30 p-3">
										<div className="space-y-1 text-sm">
											{(await searchParams).query && (
												<p>
													<span className="font-medium">Búsqueda:</span> "{(await searchParams).query}"
												</p>
											)}
											{(await searchParams).tags && (
												<p>
													<span className="font-medium">Tags:</span>{" "}
													{((await searchParams).tags || "")
														.split(",")
														.map((tag) => `#${tag}`)
														.join(", ")}
												</p>
											)}
											{(await searchParams).sortBy && (await searchParams).sortBy !== "recent" && (
												<p>
													<span className="font-medium">Orden:</span>{" "}
													{getSortLabel((await searchParams).sortBy || "recent")}
												</p>
											)}
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Commits Feed with Infinite Scroll */}
						<InfiniteCommits initialCommits={commits} initialForks={forks} searchParams={await searchParams} user={user} />
					</div>
				</div>
			</div>
		</div>
	);
}
