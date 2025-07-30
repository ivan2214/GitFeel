import { Hash, TrendingUp } from "lucide-react";
import Link from "next/link";
import { CommitCard } from "@/components/commit-card";
import { CommitComposer } from "@/components/commit-composer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/data/user";
import prisma from "@/lib/prisma";

async function getCommits() {
	return await prisma.commit.findMany({
		include: {
			author: true,
			tags: {
				include: {
					tag: true,
				},
			},
			_count: {
				select: {
					patches: true,
					stars: true,
					stashes: true,
					forks: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		take: 20,
	});
}

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
				},
			},
		},
		orderBy: {
			commits: {
				_count: "desc",
			},
		},
		take: 5,
	});
}

export default async function HomePage() {
	const currentUser = await getCurrentUser();

	const [commits, trendingTags, activeUsers] = await Promise.all([
		getCommits(),
		getTrendingTags(),
		getActiveUsers(),
	]);

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-6">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					{/* Main Feed */}
					<div className="space-y-6 lg:col-span-2">
						<CommitComposer />

						<div className="space-y-4">
							{commits.map((commit) => (
								<CommitCard
									key={commit.id}
									commit={commit}
									currentUserId={currentUser?.id}
								/>
							))}
						</div>

						{commits.length === 0 && (
							<Card>
								<CardContent className="p-12 text-center">
									<p className="text-muted-foreground">
										No hay commits aún. ¡Sé el primero en compartir!
									</p>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Trending Tags */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Hash className="h-5 w-5" />
									Tags Trending
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{trendingTags.map((tag) => (
									<Link
										key={tag.id}
										href={`/commits?tags=${tag.name}`}
										className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50"
									>
										<Badge variant="secondary">#{tag.name}</Badge>
										<span className="text-muted-foreground text-sm">
											{tag._count.commits} commits
										</span>
									</Link>
								))}
							</CardContent>
						</Card>

						{/* Active Developers */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<TrendingUp className="h-5 w-5" />
									Developers Activos
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{activeUsers.map((user) => (
									<Link
										key={user.id}
										href={`/dev/${user.id}`}
										className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50"
									>
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 font-semibold text-sm text-white">
											{user.name?.charAt(0).toUpperCase()}
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium">{user.name}</p>
											<p className="text-muted-foreground text-sm">
												{user._count.commits} commits
											</p>
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
