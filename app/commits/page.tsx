import { Filter, Search } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@/app/generated/prisma/index";
import { TerminalCommit } from "@/components/terminal-commit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
		<div className="min-h-screen bg-gray-900">
			<div className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
					{/* Filters Sidebar */}
					<div className="space-y-6">
						<Card className="border-gray-700 bg-gray-800">
							<CardContent className="p-6">
								<h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
									<Filter className="h-4 w-4" />
									Filtros
								</h2>

								<div className="space-y-4">
									<div>
										<Label className="mb-2 block font-medium text-sm">Buscar en commits</Label>
										<div className="relative">
											<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
											<Input className="pl-10" defaultValue={searchParams.query} placeholder="Buscar..." />
										</div>
									</div>

									<div>
										<Label className="mb-2 block font-medium text-sm">Tags populares</Label>
										<div className="flex flex-wrap gap-2">
											{allTags.map((tag) => (
												<Link href={`/commits?tags=${tag.name}`} key={tag.id}>
													<Badge
														className="cursor-pointer hover:bg-primary/10"
														variant={activeTags.includes(tag.name) ? "default" : "outline"}
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
					<div className="space-y-6 lg:col-span-3">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="font-bold text-2xl">Explorar Commits</h1>
								<p className="text-muted-foreground">
									{searchParams.tags || searchParams.query
										? `Resultados filtrados (${commits.length})`
										: `Todos los commits (${commits.length})`}
								</p>
							</div>
						</div>

						{/* Active Filters */}
						{(activeTags.length > 0 || searchParams.query) && (
							<Card className="border-gray-700 bg-gray-800">
								<CardContent className="p-4">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-medium text-sm">Filtros activos:</span>
										{activeTags.map((tag) => (
											<Badge key={tag} variant="secondary">
												#{tag}
												<Link
													className="ml-1 hover:text-red-500"
													href={`/commits?tags=${activeTags.filter((t) => t !== tag).join(",")}`}
												>
													×
												</Link>
											</Badge>
										))}
										{searchParams.query && (
											<Badge variant="secondary">
												"{searchParams.query}"
												<Link className="ml-1 hover:text-red-500" href="/commits">
													×
												</Link>
											</Badge>
										)}
										<Link className="text-blue-500 text-sm hover:underline" href="/commits">
											Limpiar filtros
										</Link>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Commits List */}
						<div className="space-y-4">
							{commits.map((commit) => (
								<TerminalCommit _currentUserId={user?.id} commit={commit} key={commit.id} />
							))}
						</div>

						{commits.length === 0 && (
							<Card className="border-gray-700 bg-gray-800">
								<CardContent className="p-12 text-center">
									<p className="text-muted-foreground">No se encontraron commits con estos filtros.</p>
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
