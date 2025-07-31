import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Code, MessageCircle, Send, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { startTransition } from "react";
import { GitfeelCommit } from "@/components/gitfeel-commit";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/data/user";
import { createPatch } from "@/lib/actions/patches";
import { getDictionary, type Locale } from "@/lib/dictionaries";
import prisma from "@/lib/prisma";

interface CommitDetailPageProps {
	params: Promise<{
		id: string;
		lang: Locale;
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
	const { id, lang } = await params;
	const dict = await getDictionary(lang);
	const user = await getCurrentUser();
	const commit = await getCommit(id);

	if (!commit) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<div className="space-y-6">
					{/* Navigation */}
					<div className="flex items-center gap-4">
						<Button asChild size="sm" variant="ghost">
							<Link className="flex items-center gap-2" href={`/${lang}/commits`}>
								<ArrowLeft className="h-4 w-4" />
								{dict.pages.commits.backToExplore}
							</Link>
						</Button>
					</div>

					{/* Main Commit */}
					<GitfeelCommit commit={commit} dict={dict} lang={lang} user={user} />

					{/* Add Patch Form - MOVED TO TOP */}
					{user ? (
						<Card className="commit-card">
							<div className="commit-header">
								<Send className="h-3 w-3" />
								<span>{dict.pages.commitDetail.addPatch}</span>
								<span className="ml-auto">@{user.username}</span>
							</div>
							<CardContent className="p-4">
								<form
									action={async (formData) => {
										"use server";
										startTransition(async () => {
											await createPatch(formData, lang);
										});
									}}
									className="space-y-4"
								>
									<input name="commitId" type="hidden" value={commit.id} />
									<div className="flex gap-3">
										<Avatar className="h-8 w-8 ring-2 ring-primary/20">
											<AvatarImage src={user.image || ""} />
											<AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
												{user.name?.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 space-y-3">
											<div className="code-block">
												<div className="mb-2 flex items-center gap-2 text-cyan-400">
													<span className="text-green-400">$</span>
													<span className="text-sm">git add patch</span>
												</div>
												<Textarea
													className="min-h-[80px] resize-none border-blue-500/30 border-l-2 border-none bg-transparent pl-4 font-mono text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
													name="content"
													placeholder={dict.pages.commitDetail.patchPlaceholder}
													required
												/>
											</div>
											<div className="flex justify-end">
												<Button className="gitfeel-button flex items-center gap-2" size="sm" type="submit">
													<Send className="h-4 w-4" />
													{dict.pages.commitDetail.sendPatch}
												</Button>
											</div>
										</div>
									</div>
								</form>
							</CardContent>
						</Card>
					) : (
						<Card className="commit-card">
							<div className="commit-header">
								<Code className="h-3 w-3" />
								<span>{dict.pages.commitDetail.authRequired}</span>
							</div>
							<CardContent className="p-8 text-center">
								<div className="code-block mb-4">
									<p className="text-slate-400">$ git patch --interactive</p>
									<p className="text-red-400">error: authentication required</p>
								</div>
								<p className="mb-4 text-muted-foreground">{dict.pages.commitDetail.authRequiredDescription}</p>
							</CardContent>
						</Card>
					)}

					{/* Patches Section */}
					<Card className="commit-card">
						<div className="commit-header">
							<MessageCircle className="h-3 w-3" />
							<span>{dict.pages.commitDetail.discussionThread}</span>
							<span className="ml-auto flex items-center gap-1">
								<Users className="h-3 w-3" />
								{commit._count.patches} {dict.pages.commitDetail.patches}
							</span>
						</div>
						<CardContent className="p-6">
							<div className="space-y-4">
								{commit.patches.map((patch, index) => (
									<div className="commit-card" key={patch.id}>
										<div className="commit-header">
											<Code className="h-3 w-3" />
											<span>
												patch #{index + 1} por {patch.author.username}
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
												<Link href={`/${lang}/dev/${patch.author.id}`}>
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
															href={`/${lang}/dev/${patch.author.id}`}
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
										<div className="code-block mb-4 inline-block">
											<p className="text-slate-400">$ git log --patches</p>
											<p className="text-yellow-400">warning: no patches found</p>
										</div>
										<MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
										<p className="text-muted-foreground">{dict.pages.commitDetail.noPatches}</p>
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
