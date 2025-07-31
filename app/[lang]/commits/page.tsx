import { Code, TrendingUp } from "lucide-react";
import { AdvancedSearch } from "@/components/advanced-search";
import { InfiniteCommits } from "@/components/infinite-commits";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCurrentUser } from "@/data/user";
import { getCommitsWithForks } from "@/lib/actions/commits";
import { type Dictionary, getDictionary, type Locale } from "@/lib/dictionaries";
import prisma from "@/lib/prisma";

interface CommitsPageProps {
	params: Promise<{ lang: Locale }>;
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

const getSortLabel = (sortBy: string, dic: Dictionary) => {
	switch (sortBy) {
		case "popular":
			return dic.search.filters.popular;
		case "stars":
			return dic.search.filters.stars;
		case "forks":
			return dic.search.filters.forks;
		default:
			return dic.search.filters.recent;
	}
};
export default async function CommitsPage({ params, searchParams }: CommitsPageProps) {
	const { lang } = await params;
	const dict = await getDictionary(lang);
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

	const totalResults = commits.length + forks.length;

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
					{/* Search Sidebar */}
					<div className="space-y-6">
						<AdvancedSearch allTags={allTags} dic={dict} lang={lang} />
					</div>

					{/* Main Content */}
					<div className="space-y-6 lg:col-span-3">
						{/* Header */}
						<Card className="commit-card p-0">
							<CardHeader className="commit-header">
								<Code className="h-3 w-3" />
								<span>{dict.pages.commits.explore}</span>
								<span className="ml-auto flex items-center gap-1">
									<TrendingUp className="h-3 w-3" />
									{getSortLabel((await searchParams).sortBy || "recent", dict)}
								</span>
							</CardHeader>
							<CardContent className="p-4">
								<h1 className="mb-2 font-bold text-2xl">{dict.pages.commits.title}</h1>
								<p className="text-muted-foreground">
									{(await searchParams).tags || (await searchParams).query
										? `${totalResults} ${dict.pages.commits.resultsFound}`
										: dict.pages.commits.description}
								</p>

								{/* Active Filters Summary */}
								{((await searchParams).tags || (await searchParams).query) && (
									<div className="mt-3 rounded-lg bg-muted/30 p-3">
										<div className="space-y-1 text-sm">
											{(await searchParams).query && (
												<p>
													<span className="font-medium">{dict.pages.commits.search}:</span> "{(await searchParams).query}"
												</p>
											)}
											{(await searchParams).tags && (
												<p>
													<span className="font-medium">{dict.pages.commits.tags}:</span>{" "}
													{((await searchParams).tags || "")
														.split(",")
														.map((tag) => `#${tag}`)
														.join(", ")}
												</p>
											)}
											{(await searchParams).sortBy && (await searchParams).sortBy !== "recent" && (
												<p>
													<span className="font-medium">{dict.pages.commits.order.orderBy}:</span>{" "}
													{getSortLabel((await searchParams).sortBy || "recent", dict)}
												</p>
											)}
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Commits Feed with Infinite Scroll */}
						<InfiniteCommits
							dict={dict}
							initialCommits={commits}
							initialForks={forks}
							lang={lang}
							searchParams={await searchParams}
							user={user}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
