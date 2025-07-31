import { Hash, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { GitfeelCommit } from "@/components/gitfeel-commit";
import { GitfeelComposer } from "@/components/gitfeel-composer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type DataAllPosts = CommitWithDetails | ForkWithDetails;

export default async function HomePage({ params }: { params: Promise<{ lang: Locale }> }) {
	const { lang } = await params;
	const dict = await getDictionary(lang);

	const user = await getCurrentUser();

	const { commits, forks } = await getCommitsWithForks({
		sortBy: "recent",
		limit: 20,
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

						<div className="space-y-4">
							{allPosts.map((post, index) => (
								<div key={`${post.type}-${post.data.id}-${index}`}>
									{post.type === "commit" ? (
										<GitfeelCommit commit={post.data as CommitWithDetails} dict={dict} lang={lang} user={user} />
									) : (
										<GitfeelCommit
											commit={(post.data as ForkWithDetails).commit}
											dict={dict}
											forkContent={(post.data as ForkWithDetails).content}
											forkDate={new Date(post.data.createdAt)}
											forkUser={(post.data as ForkWithDetails).user}
											isFork={true}
											lang={lang}
											user={user}
										/>
									)}
								</div>
							))}
						</div>

						{allPosts.length === 0 && (
							<Card className="commit-card">
								<CardContent className="p-12 text-center">
									<p className="text-muted-foreground">{dict.pages.home.noCommits}</p>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{!user && (
							<Card className="commit-card">
								<div className="commit-header">
									<Users className="h-3 w-3" />
									<span>{dict.pages.home.joinGitfeel}</span>
								</div>
								<CardContent className="space-y-3 p-4">
									<p className="text-muted-foreground text-sm">{dict.pages.home.joinDescription}</p>
									<div className="space-y-2">
										<Button asChild className="gitfeel-button w-full">
											<Link href={`/${lang}/auth/signin`}>{dict.pages.home.signIn}</Link>
										</Button>
										<Button asChild className="w-full bg-transparent" variant="outline">
											<Link href={`/${lang}/auth/signup`}>{dict.pages.home.signUp}</Link>
										</Button>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Trending Tags */}
						<Card className="commit-card">
							<div className="commit-header">
								<Hash className="h-3 w-3" />
								<span>{dict.pages.home.trendingTags}</span>
							</div>
							<CardContent className="space-y-3 p-4">
								{trendingTags.map((tag) => (
									<Link
										className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50"
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
						<Card className="commit-card">
							<div className="commit-header">
								<TrendingUp className="h-3 w-3" />
								<span>{dict.pages.home.activeDevelopers}</span>
							</div>
							<CardContent className="space-y-3 p-4">
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
