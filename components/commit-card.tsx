"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	Archive,
	Calendar,
	GitFork,
	MessageCircle,
	MoreHorizontal,
	Star,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { createFork, toggleStar, toggleStash } from "@/lib/actions/commits";
import { useSession } from "@/lib/auth-client";
import type { CommitWithDetails } from "@/lib/types";

interface CommitCardProps {
	commit: CommitWithDetails;
	currentUserId?: string;
	showActions?: boolean;
}

export function CommitCard({
	commit,
	currentUserId,
	showActions = true,
}: CommitCardProps) {
	const { data: session } = useSession();
	const [forkContent, setForkContent] = useState("");
	const [showForkDialog, setShowForkDialog] = useState(false);

	const { execute: executeStar, pending: starPending } = useAction(
		async () => toggleStar(commit.id),
		{},
	);

	const { execute: executeStash, pending: stashPending } = useAction(
		async () => toggleStash(commit.id),
		{},
	);

	const { execute: executeFork, pending: forkPending } = useAction(async () => {
		const result = await createFork(commit.id, forkContent.trim() || undefined);
		if (!result.errorMessage) {
			setShowForkDialog(false);
			setForkContent("");
		}
		return result;
	}, {});

	const isStarred = false; // TODO: Implement user's starred commits check
	const isStashed = false; // TODO: Implement user's stashed commits check

	return (
		<Card className="transition-colors hover:bg-muted/50">
			<CardContent className="p-6">
				<div className="flex gap-3">
					<Link href={`/dev/${commit.author.id}`}>
						<Avatar className="h-10 w-10 transition-opacity hover:opacity-80">
							<AvatarImage src={commit.author.image || ""} />
							<AvatarFallback>
								{commit.author.name?.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</Link>

					<div className="flex-1 space-y-3">
						<div className="flex items-center gap-2">
							<Link
								href={`/dev/${commit.author.id}`}
								className="font-semibold hover:underline"
							>
								{commit.author.name}
							</Link>
							<span className="text-muted-foreground">
								@{commit.author.username}
							</span>
							<span className="text-muted-foreground">·</span>
							<span className="flex items-center gap-1 text-muted-foreground text-sm">
								<Calendar className="h-3 w-3" />
								{formatDistanceToNow(new Date(commit.createdAt), {
									addSuffix: true,
									locale: es,
								})}
							</span>
						</div>

						<Link href={`/commits/${commit.id}`} className="block">
							<p className="text-foreground leading-relaxed transition-colors hover:text-foreground/80">
								{commit.content}
							</p>
						</Link>

						{commit.imageUrl && (
							<Link href={`/commits/${commit.id}`} className="block">
								<img
									src={commit.imageUrl || "/placeholder.svg"}
									alt="Commit image"
									className="h-auto max-w-full rounded-lg border transition-opacity hover:opacity-90"
								/>
							</Link>
						)}

						{commit.tags.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{commit.tags.map(({ tag }) => (
									<Link key={tag.id} href={`/commits?tags=${tag.name}`}>
										<Badge
											variant="secondary"
											className="cursor-pointer transition-colors hover:bg-primary/10"
										>
											#{tag.name}
										</Badge>
									</Link>
								))}
							</div>
						)}

						{showActions && (
							<div className="flex items-center justify-between pt-2">
								<div className="flex items-center gap-6">
									<Link
										href={`/commits/${commit.id}`}
										className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-blue-500"
									>
										<MessageCircle className="h-4 w-4" />
										<span className="text-sm">{commit._count.patches}</span>
									</Link>

									<Button
										variant="ghost"
										size="sm"
										onClick={() => executeStar()}
										disabled={starPending || !session?.user}
										className={`flex items-center gap-2 ${
											isStarred
												? "text-yellow-500"
												: "text-muted-foreground hover:text-yellow-500"
										} transition-colors`}
									>
										<Star
											className={`h-4 w-4 ${isStarred ? "fill-current" : ""}`}
										/>
										<span className="text-sm">{commit._count.stars}</span>
									</Button>

									<Dialog
										open={showForkDialog}
										onOpenChange={setShowForkDialog}
									>
										<DialogTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												disabled={!session?.user}
												className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-500"
											>
												<GitFork className="h-4 w-4" />
												<span className="text-sm">{commit._count.forks}</span>
											</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Fork este commit</DialogTitle>
											</DialogHeader>
											<div className="space-y-4">
												<div className="rounded-lg bg-muted p-4">
													<p className="mb-2 text-muted-foreground text-sm">
														Commit original:
													</p>
													<p>{commit.content}</p>
												</div>
												<Textarea
													placeholder="Agrega tu comentario al fork (opcional)"
													value={forkContent}
													onChange={(e) => setForkContent(e.target.value)}
													maxLength={280}
												/>
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														onClick={() => setShowForkDialog(false)}
													>
														Cancelar
													</Button>
													<Button
														onClick={() => executeFork()}
														disabled={forkPending}
													>
														{forkPending ? "Forking..." : "Fork"}
													</Button>
												</div>
											</div>
										</DialogContent>
									</Dialog>

									<Button
										variant="ghost"
										size="sm"
										onClick={() => executeStash()}
										disabled={stashPending || !session?.user}
										className={`flex items-center gap-2 ${
											isStashed
												? "text-blue-500"
												: "text-muted-foreground hover:text-blue-500"
										} transition-colors`}
									>
										<Archive
											className={`h-4 w-4 ${isStashed ? "fill-current" : ""}`}
										/>
									</Button>
								</div>

								{session?.user && (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="sm">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem>Reportar commit</DropdownMenuItem>
											{session.user.id === commit.authorId && (
												<>
													<DropdownMenuItem>Editar commit</DropdownMenuItem>
													<DropdownMenuItem className="text-red-600">
														Eliminar commit
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
			</CardContent>
		</Card>
	);
}
