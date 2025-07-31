"use client";

import { formatDistanceToNow } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { Archive, Calendar, Code, GitFork, MessageCircle, MoreHorizontal, Repeat2, Star } from "lucide-react";
import Link from "next/link";
import { startTransition, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { createFork, toggleStar, toggleStash } from "@/lib/actions/commits";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { CommitWithDetails, User } from "@/lib/types";
import { ImageWithSkeleton } from "./image-with-skeleton";

interface GitfeelCommitProps {
	commit: CommitWithDetails;
	user: User | null;
	dict: Dictionary;
	lang: Locale;
	showActions?: boolean;
	isFork?: boolean;
	forkUser?: User | null;
	forkContent?: string | null;
	forkDate?: Date;
}

export function GitfeelCommit({ commit, user, dict, lang, showActions = true, isFork = false, forkUser, forkContent, forkDate }: GitfeelCommitProps) {
	const [forkDialogContent, setForkDialogContent] = useState("");
	const [showForkDialog, setShowForkDialog] = useState(false);

	const { execute: executeStar, pending: starPending } = useAction(
		toggleStar,
		{},
		{
			showToasts: true,
		},
	);
	const { execute: executeStash, pending: stashPending } = useAction(
		toggleStash,
		{},
		{
			showToasts: true,
		},
	);
	const { execute: executeFork, pending: forkPending } = useAction(
		createFork,
		{},
		{
			onSuccess(state) {
				if (!state.errorMessage) {
					setShowForkDialog(false);
					setForkDialogContent("");
				}
			},
			showToasts: true,
		},
	);

	// TODO: Check if user has starred/stashed this commit
	const isStarred = false;
	const isStashed = false;

	return (
		<div className="space-y-4">
			{/* Fork Header (if this is a fork) */}
			{/* Fork Content (if fork has additional content) */}
			{isFork && forkContent && forkUser && (
				<section className="commit-card-fork w-full px-5">
					<div className="commit-header flex w-full items-center gap-2 text-muted-foreground text-sm">
						<Repeat2 className="h-4 w-4" />
						<Link className="transition-colors hover:text-primary" href={`/dev/${forkUser.id}`}>
							{forkUser.name}
						</Link>
						<span>{dict.components.gitfeelCommit.forkedThis}</span>
						{forkDate && <span>· {formatDistanceToNow(forkDate, { addSuffix: true, locale: lang === "es" ? es : enUS })}</span>}
					</div>
					<article className="commit-content flex w-full flex-col items-start gap-3">
						<div className="commit-card flex w-full flex-col items-start">
							<div className="commit-header">
								<Code className="h-3 w-3" />
								<span>{dict.components.gitfeelCommit.forkComment}</span>
							</div>
							<div className="commit-content w-full">
								<div className="code-block w-full">
									<p className="text-slate-100">{forkContent}</p>
								</div>
								{showActions && (
									<div className="flex w-full items-center justify-between border-border border-t pt-3">
										<div className="flex items-center gap-6">
											<Link
												className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-blue-400"
												href={`/commits/${commit.id}`}
											>
												<MessageCircle className="h-4 w-4" />
												<span>{commit._count.patches}</span>
											</Link>

											<Button
												className={`flex items-center gap-2 text-sm ${
													isStarred ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
												} transition-colors`}
												disabled={starPending || !user}
												onClick={() => {
													startTransition(() => {
														executeStar(commit.id);
													});
												}}
												size="sm"
												variant="ghost"
											>
												<Star className={`h-4 w-4 ${isStarred ? "fill-current" : ""}`} />
												<span>{commit._count.stars}</span>
											</Button>

											<Dialog onOpenChange={setShowForkDialog} open={showForkDialog}>
												<DialogTrigger asChild>
													<Button
														className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-green-500"
														disabled={!user}
														size="sm"
														variant="ghost"
													>
														<GitFork className="h-4 w-4" />
														<span>{commit._count.forks}</span>
													</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>{dict.components.gitfeelCommit.forkThisCommit}</DialogTitle>
													</DialogHeader>
													<div className="space-y-4">
														<div className="code-block">
															<p className="mb-2 text-muted-foreground text-sm">
																{dict.components.gitfeelCommit.originalCommit}
															</p>
															<p className="text-slate-100">"{commit.content}"</p>
														</div>
														<Textarea
															maxLength={280}
															onChange={(e) => setForkDialogContent(e.target.value)}
															placeholder={dict.components.gitfeelCommit.forkCommentPlaceholder}
															value={forkDialogContent}
														/>
														<div className="flex justify-end gap-2">
															<Button onClick={() => setShowForkDialog(false)} variant="outline">
																{dict.components.gitfeelCommit.cancel}
															</Button>
															<Button
																className="gitfeel-button"
																disabled={forkPending}
																onClick={() => {
																	startTransition(() => {
																		executeFork({
																			commitId: commit.id,
																			content: forkDialogContent,
																		});
																	});
																}}
															>
																{forkPending
																	? dict.components.gitfeelCommit.forking
																	: dict.components.gitfeelCommit.fork}
															</Button>
														</div>
													</div>
												</DialogContent>
											</Dialog>

											<Button
												className={`flex items-center gap-2 text-sm ${
													isStashed ? "text-blue-500" : "text-muted-foreground hover:text-blue-500"
												} transition-colors`}
												disabled={stashPending || !user}
												onClick={() => {
													startTransition(() => {
														executeStash(commit.id);
													});
												}}
												size="sm"
												variant="ghost"
											>
												<Archive className={`h-4 w-4 ${isStashed ? "fill-current" : ""}`} />
											</Button>
										</div>

										{user && (
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button size="sm" variant="ghost">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem>{dict.components.gitfeelCommit.reportCommit}</DropdownMenuItem>
													{user.id === commit.authorId && (
														<>
															<DropdownMenuItem>{dict.components.gitfeelCommit.editCommit}</DropdownMenuItem>
															<DropdownMenuItem className="text-red-600">
																{dict.components.gitfeelCommit.deleteCommit}
															</DropdownMenuItem>
														</>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										)}
									</div>
								)}
							</div>
						</div>
						{/* Main Commit */}
						<div className={`commit-card ml-5 w-full`}>
							{/* Commit Header */}
							<div className="commit-header">
								<Code className="h-3 w-3" />
								<span>
									{dict.components.gitfeelCommit.commitBy} {commit.author?.username || commit.author.name}
								</span>
								<span className="ml-auto flex items-center gap-1">
									<Calendar className="h-3 w-3" />
									{formatDistanceToNow(new Date(commit.createdAt), {
										addSuffix: true,
										locale: lang === "es" ? es : enUS,
									})}
								</span>
							</div>

							{/* Commit Content */}
							<div className="commit-content">
								<div className="flex gap-4">
									<Link href={`/dev/${commit.author.id}`}>
										<Avatar className="h-10 w-10 ring-2 ring-primary/10 transition-opacity hover:opacity-80">
											<AvatarImage src={commit.author.image || ""} />
											<AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
												{commit.author.name?.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
									</Link>

									<div className="flex-1 space-y-3">
										<div className="flex items-center gap-2">
											<Link className="font-semibold transition-colors hover:text-primary" href={`/dev/${commit.author.id}`}>
												{commit.author.name}
											</Link>
											<span className="text-muted-foreground">@{commit.author?.username || commit.author.name}</span>
										</div>

										<Link className="block" href={`/commits/${commit.id}`}>
											<div className="code-block">
												<div className="mb-2 flex items-center gap-2 text-cyan-400">
													<span className="text-green-400">$</span>
													<span className="text-sm">git commit -m</span>
												</div>
												<p className="border-blue-500/30 border-l-2 pl-4 text-slate-100 leading-relaxed">
													"{commit.content}"
												</p>
											</div>
										</Link>

										{commit.imageUrl && (
											<Link className="block" href={`/commits/${commit.id}`}>
												<ImageWithSkeleton
													alt={dict.components.gitfeelCommit.commitAttachment}
													className="h-auto max-w-full rounded-lg border border-border transition-opacity hover:opacity-90"
													src={commit.imageUrl || "/placeholder.svg"}
												/>
											</Link>
										)}

										{commit.tags.length > 0 && (
											<div className="flex flex-wrap gap-2">
												{commit.tags.map(({ tag }) => (
													<Link href={`/commits?tags=${tag.name}`} key={tag.id}>
														<Badge
															className="cursor-pointer border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 transition-colors hover:border-blue-500/50"
															variant="outline"
														>
															#{tag.name}
														</Badge>
													</Link>
												))}
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</article>
				</section>
			)}

			{/* Main Commit */}
			{!isFork && (
				<div className={`commit-card ${isFork ? "ml-4" : ""}`}>
					{/* Commit Header */}
					<div className="commit-header">
						<Code className="h-3 w-3" />
						<span>commit por {commit.author?.username || commit.author.name}</span>
						<span className="ml-auto flex items-center gap-1">
							<Calendar className="h-3 w-3" />
							{formatDistanceToNow(new Date(commit.createdAt), {
								addSuffix: true,
								locale: es,
							})}
						</span>
					</div>

					{/* Commit Content */}
					<div className="commit-content">
						<div className="flex gap-4">
							<Link href={`/dev/${commit.author.id}`}>
								<Avatar className="h-10 w-10 ring-2 ring-primary/10 transition-opacity hover:opacity-80">
									<AvatarImage src={commit.author.image || ""} />
									<AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
										{commit.author.name?.charAt(0).toUpperCase()}
									</AvatarFallback>
								</Avatar>
							</Link>

							<div className="flex-1 space-y-3">
								<div className="flex items-center gap-2">
									<Link className="font-semibold transition-colors hover:text-primary" href={`/dev/${commit.author.id}`}>
										{commit.author.name}
									</Link>
									<span className="text-muted-foreground">@{commit.author?.username || commit.author.name}</span>
								</div>

								<Link className="block" href={`/commits/${commit.id}`}>
									<div className="code-block">
										<div className="mb-2 flex items-center gap-2 text-cyan-400">
											<span className="text-green-400">$</span>
											<span className="text-sm">git commit -m</span>
										</div>
										<p className="border-blue-500/30 border-l-2 pl-4 text-slate-100 leading-relaxed">"{commit.content}"</p>
									</div>
								</Link>

								{commit.imageUrl && (
									<Link className="block" href={`/commits/${commit.id}`}>
										<ImageWithSkeleton
											alt="Adjunto del commit"
											className="h-auto max-w-full rounded-lg border border-border transition-opacity hover:opacity-90"
											src={commit.imageUrl || "/placeholder.svg"}
										/>
									</Link>
								)}

								{commit.tags.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{commit.tags.map(({ tag }) => (
											<Link href={`/commits?tags=${tag.name}`} key={tag.id}>
												<Badge
													className="cursor-pointer border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 transition-colors hover:border-blue-500/50"
													variant="outline"
												>
													#{tag.name}
												</Badge>
											</Link>
										))}
									</div>
								)}

								{showActions && (
									<div className="flex items-center justify-between border-border border-t pt-3">
										<div className="flex items-center gap-6">
											<Link
												className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-blue-400"
												href={`/commits/${commit.id}`}
											>
												<MessageCircle className="h-4 w-4" />
												<span>{commit._count.patches}</span>
											</Link>

											<Button
												className={`flex items-center gap-2 text-sm ${
													isStarred ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
												} transition-colors`}
												disabled={starPending || !user}
												onClick={() => {
													startTransition(() => {
														executeStar(commit.id);
													});
												}}
												size="sm"
												variant="ghost"
											>
												<Star className={`h-4 w-4 ${isStarred ? "fill-current" : ""}`} />
												<span>{commit._count.stars}</span>
											</Button>

											<Dialog onOpenChange={setShowForkDialog} open={showForkDialog}>
												<DialogTrigger asChild>
													<Button
														className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-green-500"
														disabled={!user}
														size="sm"
														variant="ghost"
													>
														<GitFork className="h-4 w-4" />
														<span>{commit._count.forks}</span>
													</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>Forkear este commit</DialogTitle>
													</DialogHeader>
													<div className="space-y-4">
														<div className="code-block">
															<p className="mb-2 text-muted-foreground text-sm">Commit original:</p>
															<p className="text-slate-100">"{commit.content}"</p>
														</div>
														<Textarea
															maxLength={280}
															onChange={(e) => setForkDialogContent(e.target.value)}
															placeholder="Agrega tu comentario al fork (opcional)"
															value={forkDialogContent}
														/>
														<div className="flex justify-end gap-2">
															<Button onClick={() => setShowForkDialog(false)} variant="outline">
																Cancelar
															</Button>
															<Button
																className="gitfeel-button"
																disabled={forkPending}
																onClick={() => {
																	startTransition(() => {
																		executeFork({
																			commitId: commit.id,
																			content: forkDialogContent,
																		});
																	});
																}}
															>
																{forkPending ? "Forkeando..." : "Fork"}
															</Button>
														</div>
													</div>
												</DialogContent>
											</Dialog>

											<Button
												className={`flex items-center gap-2 text-sm ${
													isStashed ? "text-blue-500" : "text-muted-foreground hover:text-blue-500"
												} transition-colors`}
												disabled={stashPending || !user}
												onClick={() => {
													startTransition(() => {
														executeStash(commit.id);
													});
												}}
												size="sm"
												variant="ghost"
											>
												<Archive className={`h-4 w-4 ${isStashed ? "fill-current" : ""}`} />
											</Button>
										</div>

										{user && (
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button size="sm" variant="ghost">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem>Reportar commit</DropdownMenuItem>
													{user.id === commit.authorId && (
														<>
															<DropdownMenuItem>Editar commit</DropdownMenuItem>
															<DropdownMenuItem className="text-red-600">Eliminar commit</DropdownMenuItem>
														</>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
