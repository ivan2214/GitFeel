import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommitCard } from "@/components/commit-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createPatch } from "@/lib/actions/patches";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface CommitDetailPageProps {
	params: {
		id: string;
	};
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
	const commit = await getCommit(params.id);

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

export default async function CommitDetailPage({
	params,
}: CommitDetailPageProps) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	const commit = await getCommit(params.id);

	if (!commit) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8 max-w-2xl">
				<div className="space-y-6">
					<div className="flex items-center gap-4">
						<Button asChild variant="ghost" size="sm">
							<Link href="/" className="flex items-center gap-2">
								<ArrowLeft className="h-4 w-4" />
								Volver
							</Link>
						</Button>
					</div>

					{/* Main Commit */}
					<CommitCard commit={commit} currentUserId={session?.user?.id} />

					{/* Patches (Comments) Section */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MessageCircle className="h-5 w-5" />
								Patches ({commit._count.patches})
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Add Patch Form */}
							{session?.user && (
								<form
									action={async (formData) => {
										await createPatch(formData);
									}}
									className="space-y-4"
								>
									<input type="hidden" name="commitId" value={commit.id} />
									<div className="flex gap-3">
										<Avatar className="h-8 w-8">
											<AvatarImage src={session.user.image || ""} />
											<AvatarFallback>
												{session.user.name?.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1">
											<Textarea
												name="content"
												placeholder="Escribe tu patch..."
												className="min-h-[80px]"
												required
											/>
											<div className="flex justify-end mt-2">
												<Button type="submit" size="sm">
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
									<div
										key={patch.id}
										className="flex gap-3 p-4 bg-muted/30 rounded-lg"
									>
										<Link href={`/dev/${patch.author.id}`}>
											<Avatar className="h-8 w-8">
												<AvatarImage src={patch.author.image || ""} />
												<AvatarFallback>
													{patch.author.name?.charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
										</Link>
										<div className="flex-1 space-y-1">
											<div className="flex items-center gap-2">
												<Link
													href={`/dev/${patch.author.id}`}
													className="font-medium hover:underline"
												>
													{patch.author.name}
												</Link>
												<span className="text-muted-foreground text-sm">
													{formatDistanceToNow(new Date(patch.createdAt), {
														addSuffix: true,
														locale: es,
													})}
												</span>
											</div>
											<p className="text-sm">{patch.content}</p>
										</div>
									</div>
								))}

								{commit.patches.length === 0 && (
									<div className="text-center py-8 text-muted-foreground">
										<MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
										<p>No hay patches aún. ¡Sé el primero en comentar!</p>
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
