import { Code, Filter, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@/app/generated/prisma/index";
import { GitfeelCommit } from "@/components/gitfeel-commit";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/data/user";
import prisma from "@/lib/prisma";

interface CommitsPageProps {
	searchParams: {
		tags?: string;
		query?: string;
	};
}

async function getCommits(tags?: string, query?: string) {
	const where: Prisma.CommitWhereInput = {};

	if (tags) {
		const tagNames = tags.split(",").map((tag) => tag.trim().toLowerCase());
		where.tags = {
			some: {
				tag: {
					name: {
						in: tagNames,
					},
				},
			},
		};
	}

	if (query) {
		where.content = {
			contains: query,
			mode: "insensitive",
		};
	}

	return await prisma.commit.findMany({
		where,
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
		take: 50,
	});
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
		take: 20,
	});
}

export default async function CommitsPage({ searchParams }: CommitsPageProps) {
	const user = await getCurrentUser();

	const [commits, allTags] = await Promise.all([getCommits(searchParams.tags, searchParams.query), getAllTags()]);

	const activeTags = searchParams.tags?.split(",").map((tag) => tag.trim()) || [];

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
					{/* Filters Sidebar */}
					<div className="space-y-6">
						<Card className="commit-card">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Filter className="h-4 w-4" />
									Search & Filter
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label className="mb-2 block font-medium text-sm">Search commits</Label>
									<div className="relative">
										<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
										<Input
											className="border-border bg-muted/50 pl-10"
											defaultValue={searchParams.query}
											placeholder="Search developer feelings..."
										/>
									</div>
								</div>

								<div>
									<Label className="mb-2 flex items-center gap-2 font-medium text-sm">
										<Sparkles className="h-4 w-4" />
										Popular tags
									</Label>
									<div className="flex flex-wrap gap-2">
										{allTags.map((tag) => (
											<Link href={`/commits?tags=${tag.name}`} key={tag.id}>
												<Badge
													className={`cursor-pointer transition-colors ${
														activeTags.includes(tag.name)
															? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
															: "border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 hover:border-blue-500/50"
													}`}
													variant={activeTags.includes(tag.name) ? "default" : "outline"}
												>
													#{tag.name} ({tag._count.commits})
												</Badge>
											</Link>
										))}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Main Content */}
					<div className="space-y-6 lg:col-span-3">
						<div className="commit-card">
							<div className="commit-header">
								<Code className="h-3 w-3" />
								<span>explore commits</span>
								<span className="ml-auto">
									{searchParams.tags || searchParams.query
										? `${commits.length} filtered results`
										: `${commits.length} total commits`}
								</span>
							</div>
							<div className="commit-content">
								<h1 className="mb-2 font-bold text-2xl">Explore Developer Feelings</h1>
								<p className="text-muted-foreground">
									Discover what developers are thinking, feeling, and building around the world.
								</p>
							</div>
						</div>

						{/* Active Filters */}
						{(activeTags.length > 0 || searchParams.query) && (
							<Card className="commit-card">
								<CardContent className="p-4">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-medium text-sm">Active filters:</span>
										{activeTags.map((tag) => (
											<Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white" key={tag}>
												#{tag}
												<Link
													className="ml-1 hover:text-red-300"
													href={`/commits?tags=${activeTags.filter((t) => t !== tag).join(",")}`}
												>
													×
												</Link>
											</Badge>
										))}
										{searchParams.query && (
											<Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
												"{searchParams.query}"
												<Link className="ml-1 hover:text-red-300" href="/commits">
													×
												</Link>
											</Badge>
										)}
										<Link className="text-primary text-sm hover:underline" href="/commits">
											Clear all filters
										</Link>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Commits List */}
						<div className="space-y-4">
							{commits.map((commit) => (
								<GitfeelCommit commit={commit} key={commit.id} user={user} />
							))}
						</div>

						{commits.length === 0 && (
							<Card className="commit-card">
								<CardContent className="p-12 text-center">
									<div className="code-block mb-4">
										<p className="text-slate-400">$ git log --grep="{searchParams.query || searchParams.tags}"</p>
										<p className="text-red-400">fatal: no commits found</p>
									</div>
									<p className="mb-4 text-muted-foreground">No commits match your search criteria.</p>
									<Button asChild className="gitfeel-button">
										<Link href="/commits">View all commits</Link>
									</Button>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
