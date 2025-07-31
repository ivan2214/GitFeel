import { formatDistanceToNow } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { Calendar, Code, GitCommit, Github, LinkIcon, MapPin, Twitter, Users } from "lucide-react";

import Link from "next/link";
import { notFound } from "next/navigation";
import { GitfeelCommit } from "@/components/gitfeel-commit";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/data/user";
import { toggleFollow } from "@/lib/actions/users";
import { getDictionary, type Locale } from "@/lib/dictionaries";
import prisma from "@/lib/prisma";
import type { CommitWithDetails, ForkWithDetails } from "@/lib/types";

// Forzar renderizado dinámico para permitir el uso de headers()
export const dynamic = "force-dynamic";

interface DevProfilePageProps {
	params: Promise<{
		id: string;
		lang: Locale;
	}>;
}

async function getUser(id: string) {
	return await prisma.user.findUnique({
		where: { id },
		include: {
			commits: {
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
			},
			_count: {
				select: {
					commits: true,
					followers: true,
					following: true,
				},
			},
		},
	});
}

type DataAllPosts = CommitWithDetails | ForkWithDetails;

async function checkIfFollowing(currentUserId: string, targetUserId: string) {
	const follow = await prisma.follow.findUnique({
		where: {
			followerId_followingId: {
				followerId: currentUserId,
				followingId: targetUserId,
			},
		},
	});
	return !!follow;
}

export async function generateStaticParams() {
	const users = await prisma.user.findMany({
		select: { id: true },
		take: 100,
	});

	return users.map((user) => ({
		id: user.id,
	}));
}

export async function generateMetadata({ params }: DevProfilePageProps) {
	const user = await getUser((await params).id);

	if (!user) {
		return {
			title: "Developer no encontrado",
		};
	}

	return {
		title: `${user.name} (@${user.username}) - gitfeel`,
		description: user.bio || `Perfil de ${user.name} en gitfeel`,
	};
}

export default async function DevProfilePage({ params }: DevProfilePageProps) {
	const { id, lang } = await params;
	const dict = await getDictionary(lang);
	const currentUser = await getCurrentUser();

	const user = await getUser(id);

	if (!user) {
		notFound();
	}

	const forks = await prisma.fork.findMany({
		where: {
			userId: id,
		},
		include: {
			user: true,
			commit: {
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
			},
			tags: {
				include: {
					tag: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	const isOwnProfile = currentUser?.id === user.id;
	const isFollowing = currentUser ? await checkIfFollowing(currentUser.id, user.id) : false;

	const allPosts: {
		type: "commit" | "fork";
		data: DataAllPosts;
		createdAt: Date;
	}[] = [];

	user.commits.forEach((commit) => {
		allPosts.push({ type: "commit", data: commit, createdAt: commit.createdAt });
	});

	forks.forEach((fork) => {
		allPosts.push({ type: "fork", data: fork, createdAt: fork.createdAt });
	});

	allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					{/* Profile Sidebar */}
					<div className="space-y-6">
						<Card className="commit-card">
							<div className="commit-header">
								<Code className="h-3 w-3" />
								<span>{dict.pages.dev.title}</span>
								<span className="ml-auto">@{user.username}</span>
							</div>
							<CardContent className="p-6">
								<div className="space-y-4 text-center">
									<div className="relative inline-block">
										<div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-75 blur"></div>
										<Avatar className="relative mx-auto h-24 w-24 ring-4 ring-primary/20">
											<AvatarImage src={user.image || ""} />
											<AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-2xl text-white">
												{user.name?.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
									</div>

									<div>
										<h1 className="font-bold text-xl">{user.name}</h1>
										<p className="text-muted-foreground">@{user.username}</p>
									</div>

									{user.bio && (
										<div className="code-block text-left">
											<div className="mb-2 flex items-center gap-2 text-cyan-400">
												<span className="text-green-400">$</span>
												<span className="text-sm">cat README.md</span>
											</div>
											<p className="border-blue-500/30 border-l-2 pl-4 text-slate-100">{user.bio}</p>
										</div>
									)}

									{/* Stats */}
									<div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/30 p-4">
										<div className="text-center">
											<div className="font-semibold text-primary">{user._count.commits}</div>
											<div className="text-muted-foreground text-xs">Commits</div>
										</div>
										<div className="text-center">
											<div className="font-semibold text-primary">{user._count.following}</div>
											<div className="text-muted-foreground text-xs">{dict.pages.dev.following}</div>
										</div>
										<div className="text-center">
											<div className="font-semibold text-primary">{user._count.followers}</div>
											<div className="text-muted-foreground text-xs">{dict.pages.dev.followers}</div>
										</div>
									</div>

									{/* Action Buttons */}
									{!isOwnProfile && user && (
										<form
											action={async () => {
												"use server";
												await toggleFollow(user.id);
											}}
										>
											<Input name="userId" type="hidden" value={user.id} />
											<Button
												className={`w-full ${isFollowing ? "bg-muted text-foreground hover:bg-muted/80" : "gitfeel-button"}`}
												type="submit"
											>
												<Users className="mr-2 h-4 w-4" />
												{isFollowing ? dict.pages.dev.unfollow : dict.pages.dev.follow}
											</Button>
										</form>
									)}

									{isOwnProfile && (
										<Button asChild className="gitfeel-button w-full">
											<Link href={`/${lang}/profile`}>
												<Code className="mr-2 h-4 w-4" />
												{dict.pages.dev.profileConfiguration}
											</Link>
										</Button>
									)}
								</div>

								{/* Additional Info */}
								<div className="mt-6 space-y-3 text-sm">
									{user.location && (
										<div className="flex items-center gap-2 text-muted-foreground">
											<MapPin className="h-4 w-4" />
											{user.location}
										</div>
									)}

									{user.website && (
										<div className="flex items-center gap-2 text-muted-foreground">
											<LinkIcon className="h-4 w-4" />
											<Link
												className="truncate transition-colors hover:text-primary"
												href={user.website}
												rel="noopener noreferrer"
												target="_blank"
											>
												{user.website}
											</Link>
										</div>
									)}

									{user.githubUrl && (
										<div className="flex items-center gap-2 text-muted-foreground">
											<Github className="h-4 w-4" />
											<Link
												className="truncate transition-colors hover:text-primary"
												href={user.githubUrl}
												rel="noopener noreferrer"
												target="_blank"
											>
												GitHub
											</Link>
										</div>
									)}

									{user.twitterUrl && (
										<div className="flex items-center gap-2 text-muted-foreground">
											<Twitter className="h-4 w-4" />
											<a
												className="truncate transition-colors hover:text-primary"
												href={user.twitterUrl}
												rel="noopener noreferrer"
												target="_blank"
											>
												Twitter
											</a>
										</div>
									)}

									<div className="flex items-center gap-2 text-muted-foreground">
										<Calendar className="h-4 w-4" />
										{dict.pages.dev.joined}{" "}
										{formatDistanceToNow(new Date(user.createdAt), {
											addSuffix: true,
											locale: lang === "en" ? enUS : es,
										})}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Commits Feed */}
					<div className="space-y-6 lg:col-span-2">
						<Card className="commit-card relative border-border border-t p-4">
							<div className="commit-header flex flex-col items-start">
								<section className="flex items-center gap-3">
									<GitCommit className="h-3 w-3" />
									<span>{dict.pages.dev.recentCommits}</span>
								</section>
								<span className="ml-auto">{user.commits.length} commits</span>
							</div>
						</Card>

						<div className="space-y-4">
							{allPosts.map((post, index) => (
								<div key={`${post.type}-${post.data.id}-${index}`}>
									{post.type === "commit" ? (
										<GitfeelCommit commit={post.data as CommitWithDetails} dict={dict} lang={lang} user={currentUser} />
									) : (
										<GitfeelCommit
											commit={(post.data as ForkWithDetails).commit}
											dict={dict}
											forkContent={(post.data as ForkWithDetails).content}
											forkDate={new Date(post.data.createdAt)}
											forkUser={(post.data as ForkWithDetails).user}
											isFork={true}
											lang={lang}
											user={currentUser}
										/>
									)}
								</div>
							))}
						</div>

						{allPosts.length === 0 && (
							<Card className="commit-card relative border-border border-t p-4">
								<CardContent className="commit-content p-12 text-center">
									<div className="code-block mb-4">
										<p className="text-slate-400">$ git log --author="{user.username}"</p>
										<p className="text-yellow-400">{dict.pages.dev.noCommitsFound}</p>
									</div>
									<GitCommit className="mx-auto mb-4 h-12 w-12 opacity-50" />
									<p className="text-muted-foreground">
										{isOwnProfile ? dict.pages.dev.makeFirstCommitDescription : `${user.name} ${dict.pages.dev.makeFirstCommit}`}
									</p>
									{isOwnProfile && (
										<Button asChild className="gitfeel-button mt-4">
											<Link href={`/${lang}/profile`}>{dict.pages.dev.makeFirstCommit}</Link>
										</Button>
									)}
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
