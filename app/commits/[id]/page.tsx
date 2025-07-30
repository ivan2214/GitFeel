import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, MessageCircle } from "lucide-react";

import Link from "next/link";
import { notFound } from "next/navigation";
import { GitfeelCommit } from "@/components/gitfeel-commit";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/data/user";
import { createPatch } from "@/lib/actions/patches";
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
		<div className="min-h-screen bg-gray-900">
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<div className="space-y-6">
					{/* Updated Back Button */}
					<div className="mb-6 flex items-center gap-4">
						<Button asChild size="sm" variant="ghost">
							<Link className="flex items-center gap-2" href="/commits">
								<ArrowLeft className="h-4 w-4" />
								Volver a explorar
							</Link>
						</Button>
					</div>

					{/* Main Commit */}
					<GitfeelCommit commit={commit} user={user} />

					{/* Patches (Comments) Section */}
					<Card className="border-gray-700 bg-gray-800">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-white">
								<MessageCircle className="h-5 w-5" />
								Patches ({commit._count.patches})
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Add Patch Form */}
							{user && (
								<form
									action={async (formData) => {
										"use server";
										await createPatch(formData);
									}}
									className="space-y-4"
								>
									<input name="commitId" type="hidden" value={commit.id} />
									<div className="flex gap-3">
										<Avatar className="h-8 w-8">
											<AvatarImage src={user.image || ""} />
											<AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
										</Avatar>
										<div className="flex-1">
											<Textarea
												className="min-h-[80px] border-gray-700 bg-gray-800 text-white"
												name="content"
												placeholder="Escribe tu patch..."
												required
											/>
											<div className="mt-2 flex justify-end">
												<Button size="sm" type="submit">
													Enviar Patch
												</Button>
											</div>
										</div>
									</div>
								</form>
							)}

							{/* Patches List */}
							<div className="space-y-4">
								{commit.patches.map((patch) => (
									<div className="flex gap-3 rounded-lg bg-muted/30 p-4" key={patch.id}>
										<Link href={`/dev/${patch.author.id}`}>
											<Avatar className="h-8 w-8">
												<AvatarImage src={patch.author.image || ""} />
												<AvatarFallback>{patch.author.name?.charAt(0).toUpperCase()}</AvatarFallback>
											</Avatar>
										</Link>
										<div className="flex-1 space-y-1">
											<div className="flex items-center gap-2">
												<Link className="font-medium text-white hover:underline" href={`/dev/${patch.author.id}`}>
													{patch.author.name}
												</Link>
												<span className="text-muted-foreground text-sm">
													{formatDistanceToNow(new Date(patch.createdAt), {
														addSuffix: true,
														locale: es,
													})}
												</span>
											</div>
											<p className="text-sm text-white">{patch.content}</p>
										</div>
									</div>
								))}

								{commit.patches.length === 0 && (
									<div className="py-8 text-center text-muted-foreground">
										<MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
										<p className="text-white">No hay patches aún. ¡Sé el primero en comentar!</p>
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
