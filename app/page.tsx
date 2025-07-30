import { Hash, TrendingUp, Users } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { CommitCard } from "@/components/commit-card";
import { CommitComposer } from "@/components/commit-composer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
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
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	const [commits, trendingTags, activeUsers] = await Promise.all([
		getCommits(),
		getTrendingTags(),
		getActiveUsers(),
	]);

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Main Feed */}
					<div className="lg:col-span-2 space-y-6">
						<div className="text-center space-y-2">
							<h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
								gitfeel
							</h1>
							<p className="text-muted-foreground">
								Donde los developers comparten sus commits emocionales
							</p>
						</div>

						<CommitComposer />

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
										No hay commits aún. ¡Sé el primero en compartir!
									</p>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{!session?.user && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Users className="h-5 w-5" />
										Únete a gitfeel
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<p className="text-sm text-muted-foreground">
										Comparte tus frustraciones, logros y dudas de programación
									</p>
									<div className="space-y-2">
										<Button asChild className="w-full">
											<Link href="/auth/signin">Iniciar Sesión</Link>
										</Button>
										<Button
											asChild
											variant="outline"
											className="w-full bg-transparent"
										>
											<Link href="/auth/signup">Registrarse</Link>
										</Button>
									</div>
								</CardContent>
							</Card>
						)}

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
										className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-md transition-colors"
									>
										<Badge variant="secondary">#{tag.name}</Badge>
										<span className="text-sm text-muted-foreground">
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
										className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-md transition-colors"
									>
										<div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
											{user.name?.charAt(0).toUpperCase()}
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-medium truncate">{user.name}</p>
											<p className="text-sm text-muted-foreground">
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
