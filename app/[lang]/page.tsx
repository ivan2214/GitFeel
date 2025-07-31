import { Hash, TrendingUp } from "lucide-react";
import Link from "next/link";
import { GitfeelCommit } from "@/components/gitfeel-commit";
import { GitfeelComposer } from "@/components/gitfeel-composer";
import { InfiniteCommits } from "@/components/infinite-commits";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/data/user";
import { getCommitsWithForks } from "@/lib/actions/commits";
import { getDictionary, type Locale } from "@/lib/dictionaries";
import prisma from "@/lib/prisma";
import type { CommitWithDetails, ForkWithDetails } from "@/lib/types";

// Forzar renderizado dinámico para permitir el uso de headers()
export const dynamic = "force-dynamic";

async function getTrendingTags() {
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
		take: 10,
	});
}

async function getActiveUsers() {
	return await prisma.user.findMany({
		include: {
			_count: {
				select: {
					commits: true,
					followers: true,
					forks: true,
				},
			},
		},
		where: {
			// traerse solo los que tengan commits o forks
			OR: [
				{
					commits: {
						some: {},
					},
				},
				{
					forks: {
						some: {},
					},
				},
			],
		},
		orderBy: [
			{
				commits: {
					_count: "desc",
				},
			},
			{
				forks: {
					_count: "desc",
				},
			},
		],
		take: 15,
	});
}

type DataAllPosts = CommitWithDetails | ForkWithDetails;

export default async function HomePage({ params }: { params: Promise<{ lang: Locale }> }) {
	const { lang } = await params;
	const dict = await getDictionary(lang);

	const user = await getCurrentUser();

	const { commits, forks } = await getCommitsWithForks({
		sortBy: "recent",
		limit: 5,
		offset: 0,
	});

	const [trendingTags, activeUsers] = await Promise.all([getTrendingTags(), getActiveUsers()]);

	// Combine and sort commits and forks

	const allPosts: {
		type: "commit" | "fork";
		data: DataAllPosts;
		createdAt: Date;
	}[] = [];

	commits.forEach((commit) => {
		allPosts.push({ type: "commit", data: commit, createdAt: commit.createdAt });
	});

	forks.forEach((fork) => {
		allPosts.push({ type: "fork", data: fork, createdAt: fork.createdAt });
	});

	allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-6">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					{/* Main Feed */}
					<div className="space-y-6 lg:col-span-2">
						<GitfeelComposer dict={dict} user={user} />

						<InfiniteCommits
							dict={dict}
							initialCommits={commits}
							initialForks={forks}
							lang={lang}
							searchParams={{
								tags: "",
								query: "",
								sortBy: "recent",
							}}
							user={user}
						/>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Trending Tags */}
						<Card className="commit-card rounded-xl border border-border bg-card/50 p-1.5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
							<div className="commit-header flex items-center gap-2 border-border/50 border-b">
								<Hash className="h-3 w-3" />
								<span>{dict.pages.home.trendingTags}</span>
							</div>
							<CardContent className="grid max-h-56 max-w-md grid-cols-1 place-items-start gap-3 overflow-y-scroll py-1 pr-16">
								{trendingTags.map((tag) => (
									<Link
										className="flex w-full items-center justify-between rounded-md transition-colors hover:bg-muted/70"
										href={`/${lang}/commits?tags=${tag.name}`}
										key={tag.id}
									>
										<Badge
											className="border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400"
											variant="outline"
										>
											#{tag.name}
										</Badge>
										<span className="text-muted-foreground text-sm">{tag._count.commits} commits</span>
									</Link>
								))}
							</CardContent>
						</Card>

						{/* Active Developers */}
						<Card className="commit-card rounded-xl border border-border bg-card/50 p-1.5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
							<div className="commit-header flex items-center gap-2 border-border/50 border-b">
								<TrendingUp className="h-3 w-3" />
								<span>{dict.pages.home.activeDevelopers}</span>
							</div>
							<CardContent className="grid max-h-56 max-w-md grid-cols-1 place-items-start gap-3 overflow-y-scroll py-1 pr-16">
								{activeUsers.map((activeUser) => (
									<Link
										className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50"
										href={`/${lang}/dev/${activeUser.id}`}
										key={activeUser.id}
									>
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 font-semibold text-sm text-white">
											{activeUser.name?.charAt(0).toUpperCase()}
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium">{activeUser.name}</p>
											<p className="text-muted-foreground text-sm">{activeUser._count.commits} commits</p>
											<p className="text-muted-foreground text-sm">{activeUser._count.forks} forks</p>
										</div>
									</Link>
								))}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
