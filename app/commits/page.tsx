import { Filter, Search } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { CommitCard } from "@/components/commit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { Prisma } from "../generated/prisma";

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
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	const [commits, allTags] = await Promise.all([
		getCommits(searchParams.tags, searchParams.query),
		getAllTags(),
	]);

	const activeTags =
		searchParams.tags?.split(",").map((tag) => tag.trim()) || [];

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
					{/* Filters Sidebar */}
					<div className="space-y-6">
						<Card>
							<CardContent className="p-6">
								<h2 className="font-semibold mb-4 flex items-center gap-2">
									<Filter className="h-4 w-4" />
									Filtros
								</h2>

								<div className="space-y-4">
									<div>
										<Label className="text-sm font-medium mb-2 block">
											Buscar en commits
										</Label>
										<div className="relative">
											<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
											<Input
												placeholder="Buscar..."
												defaultValue={searchParams.query}
												className="pl-10"
											/>
										</div>
									</div>

									<div>
										<Label className="text-sm font-medium mb-2 block">
											Tags populares
										</Label>
										<div className="flex flex-wrap gap-2">
											{allTags.map((tag) => (
												<Link key={tag.id} href={`/commits?tags=${tag.name}`}>
													<Badge
														variant={
															activeTags.includes(tag.name)
																? "default"
																: "outline"
														}
														className="cursor-pointer hover:bg-primary/10"
													>
														#{tag.name} ({tag._count.commits})
													</Badge>
												</Link>
											))}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Main Content */}
					<div className="lg:col-span-3 space-y-6">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-2xl font-bold">Explorar Commits</h1>
								<p className="text-muted-foreground">
									{searchParams.tags || searchParams.query
										? `Resultados filtrados (${commits.length})`
										: `Todos los commits (${commits.length})`}
								</p>
							</div>
							<Button asChild>
								<Link href="/">Volver al inicio</Link>
							</Button>
						</div>

						{/* Active Filters */}
						{(activeTags.length > 0 || searchParams.query) && (
							<Card>
								<CardContent className="p-4">
									<div className="flex items-center gap-2 flex-wrap">
										<span className="text-sm font-medium">
											Filtros activos:
										</span>
										{activeTags.map((tag) => (
											<Badge key={tag} variant="secondary">
												#{tag}
												<Link
													href={`/commits?tags=${activeTags.filter((t) => t !== tag).join(",")}`}
													className="ml-1 hover:text-red-500"
												>
													×
												</Link>
											</Badge>
										))}
										{searchParams.query && (
											<Badge variant="secondary">
												"{searchParams.query}"
												<Link
													href="/commits"
													className="ml-1 hover:text-red-500"
												>
													×
												</Link>
											</Badge>
										)}
										<Link
											href="/commits"
											className="text-sm text-blue-500 hover:underline"
										>
											Limpiar filtros
										</Link>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Commits List */}
						<div className="space-y-4">
							{commits.map((commit) => (
								<CommitCard
									key={commit.id}
									commit={commit}
									currentUserId={session?.user?.id}
								/>
							))}
						</div>

						{commits.length === 0 && (
							<Card>
								<CardContent className="p-12 text-center">
									<p className="text-muted-foreground">
										No se encontraron commits con estos filtros.
									</p>
									<Button asChild className="mt-4">
										<Link href="/commits">Ver todos los commits</Link>
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
