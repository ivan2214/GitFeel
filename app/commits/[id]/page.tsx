import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Code, MessageCircle } from "lucide-react";

import Link from "next/link";
import { notFound } from "next/navigation";
import { GitfeelCommit } from "@/components/gitfeel-commit";
import { PatchForm } from "@/components/patch-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/data/user";
import prisma from "@/lib/prisma";

interface CommitDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

async function getCommit(id: string) {
	return await prisma.commit.findUnique({
		where: { id },
		include: {
			author: true,
			tags: {
				include: {
					tag: true,
				},
			},
			patches: {
				include: {
					author: true,
				},
				orderBy: {
					createdAt: "asc",
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
	});
}

export async function generateStaticParams() {
	const commits = await prisma.commit.findMany({
		select: { id: true },
		take: 100,
	});

	return commits.map((commit) => ({
		id: commit.id,
	}));
}

export async function generateMetadata({ params }: CommitDetailPageProps) {
	const commit = await getCommit((await params).id);

	if (!commit) {
		return {
			title: "Commit no encontrado",
		};
	}

	return {
		title: `${commit.author.name}: ${commit.content.slice(0, 50)}...`,
		description: commit.content,
	};
}

export default async function CommitDetailPage({ params }: CommitDetailPageProps) {
	const user = await getCurrentUser();

	const commit = await getCommit((await params).id);

	if (!commit) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<div className="space-y-6">
					{/* Updated Back Button */}
					<div className="flex items-center gap-4">
						<Button asChild size="sm" variant="ghost">
							<Link className="flex items-center gap-2" href="/commits">
								<ArrowLeft className="h-4 w-4" />
								Volver a explorar
							</Link>
						</Button>
					</div>

					{/* Main Commit */}
					<GitfeelCommit commit={commit} user={user} />

					{/* Patches Section */}
					<Card className="commit-card">
						<div className="commit-header">
							<MessageCircle className="h-3 w-3" />
							<span>patches & discussions</span>
							<span className="ml-auto">{commit._count.patches} patches</span>
						</div>
						<CardContent className="space-y-6 p-6">
							{/* Add Patch Form */}
							{user ? (
								<PatchForm commitId={commit.id} user={user} />
							) : (
								<div className="py-8 text-center">
									<div className="code-block mb-4">
										<p className="text-slate-400">$ git patch --interactive</p>
										<p className="text-red-400">error: authentication required</p>
									</div>
									<p className="mb-4 text-muted-foreground">Sign in to contribute to this discussion</p>
								</div>
							)}

							{/* Patches List */}
							<div className="space-y-4">
								{commit.patches.map((patch, index) => (
									<div className="commit-card" key={patch.id}>
										<div className="commit-header">
											<Code className="h-3 w-3" />
											<span>
												patch #{index + 1} by {patch.author.username}
											</span>
											<span className="ml-auto">
												{formatDistanceToNow(new Date(patch.createdAt), {
													addSuffix: true,
													locale: es,
												})}
											</span>
										</div>
										<div className="commit-content">
											<div className="flex gap-3">
												<Link href={`/dev/${patch.author.id}`}>
													<Avatar className="h-8 w-8 ring-2 ring-primary/10">
														<AvatarImage src={patch.author.image || ""} />
														<AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
															{patch.author.name?.charAt(0).toUpperCase()}
														</AvatarFallback>
													</Avatar>
												</Link>
												<div className="flex-1">
													<div className="mb-2 flex items-center gap-2">
														<Link
															className="font-medium transition-colors hover:text-primary"
															href={`/dev/${patch.author.id}`}
														>
															{patch.author.name}
														</Link>
														<span className="text-muted-foreground text-sm">@{patch.author.username}</span>
													</div>
													<div className="code-block">
														<p className="text-slate-100">{patch.content}</p>
													</div>
												</div>
											</div>
										</div>
									</div>
								))}

								{commit.patches.length === 0 && (
									<div className="py-8 text-center">
										<div className="code-block mb-4">
											<p className="text-slate-400">$ git log --patches</p>
											<p className="text-yellow-400">warning: no patches found</p>
										</div>
										<MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
										<p className="text-muted-foreground">No patches yet. Be the first to contribute!</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
