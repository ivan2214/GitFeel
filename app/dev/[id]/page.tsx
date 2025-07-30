import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
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
import prisma from "@/lib/prisma";

interface DevProfilePageProps {
	params: Promise<{
		id: string;
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
	const currentUser = await getCurrentUser();

	const user = await getUser((await params).id);

	if (!user) {
		notFound();
	}

	const isOwnProfile = currentUser?.id === user.id;
	const isFollowing = currentUser ? await checkIfFollowing(currentUser.id, user.id) : false;

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					{/* Profile Sidebar */}
					<div className="space-y-6">
						<Card className="commit-card">
							<div className="commit-header">
								<Code className="h-3 w-3" />
								<span>developer profile</span>
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
											<div className="text-muted-foreground text-xs">Following</div>
										</div>
										<div className="text-center">
											<div className="font-semibold text-primary">{user._count.followers}</div>
											<div className="text-muted-foreground text-xs">Followers</div>
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
												{isFollowing ? "Unfollow" : "Follow"}
											</Button>
										</form>
									)}

									{isOwnProfile && (
										<Button asChild className="gitfeel-button w-full">
											<Link href="/profile">
												<Code className="mr-2 h-4 w-4" />
												Edit Profile
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
										Joined{" "}
										{formatDistanceToNow(new Date(user.createdAt), {
											addSuffix: true,
											locale: es,
										})}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Commits Feed */}
					<div className="space-y-6 lg:col-span-2">
						<Card className="commit-card">
							<div className="commit-header">
								<GitCommit className="h-3 w-3" />
								<span>recent commits</span>
								<span className="ml-auto">{user.commits.length} commits</span>
							</div>
						</Card>

						<div className="space-y-4">
							{user.commits.map((commit) => (
								<GitfeelCommit commit={commit} key={commit.id} user={user} />
							))}
						</div>

						{user.commits.length === 0 && (
							<Card className="commit-card">
								<CardContent className="p-12 text-center">
									<div className="code-block mb-4">
										<p className="text-slate-400">$ git log --author="{user.username}"</p>
										<p className="text-yellow-400">warning: no commits found</p>
									</div>
									<GitCommit className="mx-auto mb-4 h-12 w-12 opacity-50" />
									<p className="text-muted-foreground">
										{isOwnProfile
											? "You haven't made any commits yet. Share your first developer feeling!"
											: `${user.name} hasn't made any commits yet.`}
									</p>
									{isOwnProfile && (
										<Button asChild className="gitfeel-button mt-4">
											<Link href="/">Make your first commit</Link>
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
