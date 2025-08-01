"use client";

import { formatDistanceToNow } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { debounce } from "lodash";
import { Archive, Calendar, Code, GitFork, MessageCircle, MoreHorizontal, Plus, Repeat2, Sparkles, Star, X } from "lucide-react";
import Link from "next/link";
import { startTransition, useCallback, useEffect, useState } from "react";
import type { TagInput } from "@/app/[lang]/profile/components/profile-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { createFork, suggestTags, toggleStar, toggleStash } from "@/lib/actions/commits";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { CommitWithDetails, Tag, User } from "@/lib/types";
import { cn, generateRandomColorTailwind } from "@/lib/utils";
import { ImageWithSkeleton } from "./image-with-skeleton";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface GitfeelCommitProps {
	commit: CommitWithDetails;
	user: User<{
		include: {
			stars: {
				include: {
					commit: true;
				};
			};
			stashes: {
				include: {
					commit: true;
				};
			};
		};
	}> | null;
	dict: Dictionary;
	lang: Locale;
	showActions?: boolean;
	isFork?: boolean;
	forkUser?: User | null;
	forkContent?: string | null;
	forkDate?: Date;
	forkTags?: Tag[]; // New prop for fork's tags
}

export function GitfeelCommit({
	commit,
	user,
	dict,
	lang,
	showActions = true,
	isFork = false,
	forkUser,
	forkContent,
	forkDate,
	forkTags = [], // Default to empty array
}: GitfeelCommitProps) {
	const [forkDialogContent, setForkDialogContent] = useState("");
	const [showForkDialog, setShowForkDialog] = useState(false);
	const [forkTagInput, setForkTagInput] = useState<TagInput>({ name: "", color: "" }); // State for tag input in fork modal
	const [forkSuggestedTags, setForkSuggestedTags] = useState<TagInput[]>([]); // State for suggested tags in fork modal
	const [forkSelectedTags, setForkSelectedTags] = useState<TagInput[]>([]); // State for selected tags in fork modal
	const [isLoadingForkTags, setIsLoadingForkTags] = useState(false); // State for loading tags in fork modal

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
					setForkSelectedTags([]);
					setForkSuggestedTags([]);
				}
			},
			showToasts: true,
		},
	);

	// TODO: Check if user has starred/stashed this commit
	const isStarred = user?.stars?.some((star) => star.commit.id === commit.id);
	const isStashed = user?.stashes?.some((stash) => stash.commit.id === commit.id);

	const debouncedSuggestForkTags = useCallback(
		debounce(async (text: string) => {
			if (text.length > 10) {
				setIsLoadingForkTags(true);
				try {
					const { tags } = await suggestTags(text, lang);
					console.log("tags", tags);

					setForkSuggestedTags(tags);
				} catch (error) {
					console.error("Error getting fork tag suggestions:", error);
				} finally {
					setIsLoadingForkTags(false);
				}
			} else {
				setForkSuggestedTags([]);
			}
		}, 1000),
		[],
	);

	useEffect(() => {
		debouncedSuggestForkTags(forkDialogContent);
	}, [forkDialogContent, debouncedSuggestForkTags]);

	const addForkTag = (tag: TagInput) => {
		if (!forkSelectedTags.includes(tag) && forkSelectedTags.length < 5) {
			setForkSelectedTags([...forkSelectedTags, tag]);
		}
	};

	const removeForkTag = (tag: TagInput) => {
		setForkSelectedTags(forkSelectedTags.filter((t) => t !== tag));
	};

	const addCustomForkTag = () => {
		if (forkTagInput.name && !forkSelectedTags.includes(forkTagInput)) {
			addForkTag(forkTagInput);
			setForkTagInput({ name: "", color: "" });
		}
	};

	return (
		<div className="space-y-4">
			{isFork ? (
				<div className="relative space-y-4 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-4 shadow-lg">
					{/* Fork Connection Line */}
					<div className="absolute top-16 bottom-4 left-6 w-0.5 bg-gradient-to-b from-purple-400 to-blue-400 opacity-60" />

					{/* New Fork Header */}
					{forkUser && (
						<div className="flex items-center gap-3 text-muted-foreground text-sm">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 ring-2 ring-purple-400/30">
								<Repeat2 className="h-4 w-4 text-purple-400" />
							</div>

							<Link
								className="flex items-center gap-2 font-semibold text-primary transition-all hover:text-purple-600 hover:opacity-80"
								href={`/${lang}/dev/${forkUser.id}`}
							>
								<Avatar className="h-10 w-10 ring-2 ring-primary/10">
									<AvatarImage src={forkUser.image || ""} />
									<AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
										{forkUser.name?.charAt(0).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								{forkUser.name}
							</Link>
							<span className="text-xs">{dict.components.gitfeelCommit.forkedThis}</span>
							{forkDate && (
								<span className="text-xs">
									· {formatDistanceToNow(forkDate, { addSuffix: true, locale: lang === "es" ? es : enUS })}
								</span>
							)}
						</div>
					)}

					{/* Original Commit Card (nested inside the fork container) */}
					<div className="commit-card relative mt-4 ml-8 border-border border-t pt-4">
						{/* Connection dot */}
						<div className="-left-8 absolute top-6 h-3 w-3 rounded-full bg-blue-400 ring-2 ring-blue-400/30" />
						{/* Commit Header */}
						<div className="commit-header flex flex-col items-start">
							<div className="flex items-center gap-2">
								<Code className="h-3 w-3" />
								<span>
									{dict.components.gitfeelCommit.commitBy} {commit.author.username}
								</span>
							</div>
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
								<Link href={`/${lang}/dev/${commit.author.id}`}>
									<Avatar className="h-10 w-10 ring-2 ring-primary/10 transition-opacity hover:opacity-80">
										<AvatarImage src={commit.author.image || ""} />
										<AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
											{commit.author.name?.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
								</Link>

								<div className="flex-1 space-y-3">
									<div className="flex items-center gap-2">
										<Link
											className="font-semibold text-primary transition-colors hover:text-purple-600"
											href={`/${lang}/dev/${commit.author.id}`}
										>
											{commit.author.name}
										</Link>
										<span className="text-muted-foreground">@{commit.author.username}</span>
									</div>

									<Link className="block" href={`/${lang}/commits/${commit.id}`}>
										<div className="code-block">
											<div className="mb-2 flex items-center gap-2 text-cyan-400">
												<span className="text-green-400">$</span>
												<span className="text-sm">git commit -m</span>
											</div>
											<p className="border-blue-500/30 border-l-2 pl-4 text-slate-100 leading-relaxed">"{commit.content}"</p>
										</div>
									</Link>

									{commit.imageUrl && (
										<Link className="block" href={`/${lang}/commits/${commit.id}`}>
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
												<Link href={`/${lang}/commits?tags=${tag.name}`} key={tag.id}>
													<Badge
														className={cn(
															"cursor-pointer border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 transition-colors hover:border-blue-500/50",
															tag.color,
														)}
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
												<Button
													className={`flex items-center gap-2 text-sm ${
														isStarred ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
													} transition-colors`}
													disabled={starPending || !user}
													onClick={() => {
														startTransition(() => {
															executeStar({ commitId: commit.id, lang });
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
																	{dict.components.gitfeelCommit.originalCommit}:
																</p>
																<p className="text-slate-100">"{commit.content}"</p>
															</div>
															<Textarea
																maxLength={280}
																onChange={(e) => setForkDialogContent(e.target.value)}
																placeholder={dict.components.gitfeelCommit.forkCommentPlaceholder}
																value={forkDialogContent}
															/>

															{/* Tag suggestions for fork */}
															{(forkSuggestedTags.length > 0 || isLoadingForkTags) && (
																<div className="space-y-2">
																	<div className="flex items-center gap-2">
																		<Sparkles className="h-4 w-4 text-purple-400" />
																		<span className="font-medium text-purple-400 text-sm">Tags sugeridos:</span>
																		{isLoadingForkTags && (
																			<div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
																		)}
																	</div>
																	<div className="flex flex-wrap gap-2">
																		{forkSuggestedTags.map((tag) => (
																			<Badge
																				className={cn(
																					"cursor-pointer transition-colors hover:bg-purple-800/50",
																					forkSelectedTags.includes(tag) && "bg-purple-600 text-white",
																					tag.color
																						? tag.color
																						: "bg-purple-900/50 text-purple-300 hover:bg-purple-800/50",
																				)}
																				key={tag.name}
																				onClick={() => addForkTag(tag)}
																				variant={forkSelectedTags.includes(tag) ? "default" : "outline"}
																			>
																				#{tag.name}
																			</Badge>
																		))}
																	</div>
																</div>
															)}

															{/* Selected tags for fork */}
															{forkSelectedTags.length > 0 && (
																<div className="space-y-2">
																	<Label className="font-medium text-sm">
																		{dict.components.gitfeelCommit.forkTagPlaceholder}
																	</Label>
																	<div className="flex flex-wrap gap-2">
																		{forkSelectedTags.map((tag) => (
																			<Badge
																				className="flex items-center gap-1 bg-purple-600 text-white"
																				key={tag.name}
																			>
																				#{tag.name}
																				<X
																					className="h-3 w-3 cursor-pointer"
																					onClick={() => removeForkTag(tag)}
																				/>
																			</Badge>
																		))}
																	</div>
																</div>
															)}

															{/* Add Custom Tag for fork */}
															<div className="space-y-2">
																<Label className="font-medium text-sm">
																	{dict.components.gitfeelCommit.forkTagPlaceholder}
																</Label>
																<div className="flex gap-2">
																	<Input
																		className="border-border bg-muted/50"
																		onChange={(e) =>
																			setForkTagInput({
																				name: e.target.value,
																				color: generateRandomColorTailwind(),
																			})
																		}
																		placeholder={dict.components.gitfeelCommit.forkTagPlaceholder}
																		value={forkTagInput.name}
																	/>
																	<Button
																		className="gitfeel-button"
																		disabled={
																			!forkTagInput.name.trim() || forkSelectedTags.includes(forkTagInput)
																		}
																		onClick={addCustomForkTag}
																		size="sm"
																	>
																		<Plus className="h-4 w-4" />
																	</Button>
																</div>
															</div>

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
																				lang,
																				content: forkDialogContent,
																				tagNames: forkSelectedTags,
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

												<Link
													className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-blue-400"
													href={`/${lang}/commits/${commit.id}`}
												>
													<MessageCircle className="h-4 w-4" />
													<span>{commit._count.patches}</span>
												</Link>

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
						</div>
					</div>

					{/* Fork Content (Comment & Tags) */}
					{(forkContent || forkTags.length > 0) && (
						<div className="ml-10 space-y-3">
							{forkContent && (
								<div className="code-block">
									<div className="mb-2 flex items-center gap-2 text-cyan-400">
										<span className="text-green-400">$</span>
										<span className="text-sm">git change --amend -m</span>
									</div>
									<p className="border-blue-500/30 border-l-2 pl-4 text-slate-100 leading-relaxed">"{forkContent}"</p>
								</div>
							)}
							{forkTags.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{forkTags.map((tag) => (
										<Link href={`/${lang}/commits?tags=${tag.name}`} key={tag.id}>
											<Badge
												className="cursor-pointer border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-400 transition-colors hover:border-purple-500/50"
												variant="outline"
											>
												#{tag.name}
											</Badge>
										</Link>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			) : (
				// Original Commit Card (when not a fork)
				<div className="commit-card rounded-xl border border-border bg-card/50 p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
					{/* Commit Header */}
					<div className="commit-header mb-4 flex items-center gap-2 border-border/50 border-b pb-2">
						<div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 ring-2 ring-blue-400/30">
							<Code className="h-3 w-3 text-blue-400" />
						</div>
						<span className="font-medium text-sm">commit por {commit.author.username}</span>
						<span className="ml-auto flex items-center gap-1 text-muted-foreground text-xs">
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
							<Link href={`/${lang}/dev/${commit.author.id}`}>
								<Avatar className="h-10 w-10 ring-2 ring-primary/10 transition-opacity hover:opacity-80">
									<AvatarImage src={commit.author.image || ""} />
									<AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
										{commit.author.name?.charAt(0).toUpperCase()}
									</AvatarFallback>
								</Avatar>
							</Link>

							<div className="flex-1 space-y-3">
								<div className="flex items-center gap-2">
									<Link
										className="font-semibold text-primary transition-colors hover:text-purple-600"
										href={`/${lang}/dev/${commit.author.id}`}
									>
										{commit.author.name}
									</Link>
									<span className="text-muted-foreground">@{commit.author.username}</span>
								</div>

								<Link className="block" href={`/${lang}/commits/${commit.id}`}>
									<div className="code-block">
										<div className="mb-2 flex items-center gap-2 text-cyan-400">
											<span className="text-green-400">$</span>
											<span className="text-sm">git commit -m</span>
										</div>
										<p className="line-clamp-6 border-blue-500/30 border-l-2 pl-4 text-slate-100 leading-relaxed">
											"{commit.content}"
										</p>
									</div>
								</Link>

								{commit.imageUrl && (
									<Link className="block" href={`/${lang}/commits/${commit.id}`}>
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
											<Link href={`/${lang}/commits?tags=${tag.name}`} key={tag.id}>
												<Badge
													className={cn(
														"cursor-pointer border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-400 transition-colors hover:border-purple-500/50",
														tag.color,
													)}
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
											<Button
												className={`flex items-center gap-2 text-sm ${
													isStarred ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
												} transition-colors`}
												disabled={starPending || !user}
												onClick={() => {
													startTransition(() => {
														executeStar({ commitId: commit.id, lang });
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
															<p className="mb-2 text-muted-foreground text-sm">Commit original:</p>
															<p className="text-slate-100">"{commit.content}"</p>
														</div>
														<Textarea
															maxLength={280}
															onChange={(e) => setForkDialogContent(e.target.value)}
															placeholder={dict.components.gitfeelCommit.forkCommentPlaceholder}
															value={forkDialogContent}
														/>

														{/* Tag suggestions for fork */}
														{(forkSuggestedTags.length > 0 || isLoadingForkTags) && (
															<div className="space-y-2">
																<div className="flex items-center gap-2">
																	<Sparkles className="h-4 w-4 text-purple-400" />
																	<span className="font-medium text-purple-400 text-sm">Tags sugeridos:</span>
																	{isLoadingForkTags && (
																		<div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
																	)}
																</div>
																<div className="flex flex-wrap gap-2">
																	{forkSuggestedTags.map((tag) => (
																		<Badge
																			/* 																			className={`cursor-pointer transition-colors ${
																				forkSelectedTags.includes(tag)
																					? "border-purple-500 bg-purple-600 text-white"
																					: "border-purple-500 bg-purple-900/50 text-purple-300 hover:bg-purple-800/50"
																			}`} */
																			className={cn(
																				"cursor-pointer transition-colors",
																				forkSelectedTags.includes(tag)
																					? "border-purple-500 bg-purple-600 text-white"
																					: "border-purple-500 bg-purple-900/50 text-purple-300 hover:bg-purple-800/50",
																			)}
																			key={tag.name}
																			onClick={() => addForkTag(tag)}
																			variant={forkSelectedTags.includes(tag) ? "default" : "outline"}
																		>
																			#{tag.name}
																		</Badge>
																	))}
																</div>
															</div>
														)}

														{/* Selected tags for fork */}
														{forkSelectedTags.length > 0 && (
															<div className="space-y-2">
																<Label className="font-medium text-sm">
																	{dict.components.gitfeelCommit.forkTagPlaceholder}
																</Label>
																<div className="flex flex-wrap gap-2">
																	{forkSelectedTags.map((tag) => (
																		<Badge
																			className="flex items-center gap-1 bg-purple-600 text-white"
																			key={tag.name}
																		>
																			#{tag.name}
																			<Button
																				className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-600/50"
																				onClick={() => removeForkTag(tag)}
																			>
																				<X className="h-3 w-3 cursor-pointer" />
																			</Button>
																		</Badge>
																	))}
																</div>
															</div>
														)}

														{/* Add Custom Tag for fork */}
														<div className="space-y-2">
															<Label className="font-medium text-sm">
																{dict.components.gitfeelCommit.forkTagPlaceholder}
															</Label>
															<div className="flex gap-2">
																<Input
																	className="border-border bg-muted/50"
																	onChange={(e) =>
																		setForkTagInput({
																			name: e.target.value,
																			color: generateRandomColorTailwind(),
																		})
																	}
																	onKeyDown={(e) => e.key === "Enter" && addCustomForkTag()}
																	placeholder={dict.components.gitfeelCommit.forkTagPlaceholder}
																	value={forkTagInput.name}
																/>
																<Button
																	className="gitfeel-button"
																	disabled={!forkTagInput.name.trim() || forkSelectedTags.includes(forkTagInput)}
																	onClick={addCustomForkTag}
																	size="sm"
																>
																	<Plus className="h-4 w-4" />
																</Button>
															</div>
														</div>

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
																			tagNames: forkSelectedTags,
																			lang,
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

											<Link
												className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-blue-400"
												href={`/${lang}/commits/${commit.id}`}
											>
												<MessageCircle className="h-4 w-4" />
												<span>{commit._count.patches}</span>
											</Link>

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
															<DropdownMenuItem>Editar commit</DropdownMenuItem>
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
					</div>
				</div>
			)}
		</div>
	);
}
