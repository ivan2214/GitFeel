import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	Calendar,
	GitCommit,
	Github,
	LinkIcon,
	MapPin,
	Twitter,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommitCard } from "@/components/commit-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleFollow } from "@/lib/actions/users";
import { auth } from "@/lib/auth";
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
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	const user = await getUser((await params).id);

	if (!user) {
		notFound();
	}

	const isOwnProfile = session?.user?.id === user.id;
	const isFollowing = session?.user
		? await checkIfFollowing(session.user.id, user.id)
		: false;

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					{/* Profile Sidebar */}
					<div className="space-y-6">
						<Card>
							<CardContent className="p-6">
								<div className="space-y-4 text-center">
									<Avatar className="mx-auto h-24 w-24">
										<AvatarImage src={user.image || ""} />
										<AvatarFallback className="text-2xl">
											{user.name?.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>

									<div>
										<h1 className="font-bold text-xl">{user.name}</h1>
										<p className="text-muted-foreground">@{user.username}</p>
									</div>

									{user.bio && (
										<p className="text-center text-sm">{user.bio}</p>
									)}

									<div className="flex justify-center gap-6 text-sm">
										<div className="text-center">
											<div className="font-semibold">{user._count.commits}</div>
											<div className="text-muted-foreground">Commits</div>
										</div>
										<div className="text-center">
											<div className="font-semibold">
												{user._count.following}
											</div>
											<div className="text-muted-foreground">Siguiendo</div>
										</div>
										<div className="text-center">
											<div className="font-semibold">
												{user._count.followers}
											</div>
											<div className="text-muted-foreground">Seguidores</div>
										</div>
									</div>

									{!isOwnProfile && session?.user && (
										<form
											action={async () => {
												await toggleFollow(user.id);
											}}
										>
											<input type="hidden" name="userId" value={user.id} />
											<Button
												type="submit"
												variant={isFollowing ? "outline" : "default"}
												className="w-full"
											>
												{isFollowing ? "Untrack" : "Clone"}
											</Button>
										</form>
									)}

									{isOwnProfile && (
										<Button asChild className="w-full">
											<Link href="/profile">Editar Perfil</Link>
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
											<a
												href={user.website}
												target="_blank"
												rel="noopener noreferrer"
												className="truncate hover:text-blue-500"
											>
												{user.website}
											</a>
										</div>
									)}

									{user.githubUrl && (
										<div className="flex items-center gap-2 text-muted-foreground">
											<Github className="h-4 w-4" />
											<a
												href={user.githubUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="truncate hover:text-blue-500"
											>
												GitHub
											</a>
										</div>
									)}

									{user.twitterUrl && (
										<div className="flex items-center gap-2 text-muted-foreground">
											<Twitter className="h-4 w-4" />
											<a
												href={user.twitterUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="truncate hover:text-blue-500"
											>
												Twitter
											</a>
										</div>
									)}

									<div className="flex items-center gap-2 text-muted-foreground">
										<Calendar className="h-4 w-4" />
										Se unió{" "}
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
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<GitCommit className="h-5 w-5" />
									Commits de {user.name}
								</CardTitle>
							</CardHeader>
						</Card>

						<div className="space-y-4">
							{user.commits.map((commit) => (
								<CommitCard
									key={commit.id}
									commit={commit}
									currentUserId={session?.user?.id}
								/>
							))}
						</div>

						{user.commits.length === 0 && (
							<Card>
								<CardContent className="p-12 text-center">
									<GitCommit className="mx-auto mb-4 h-12 w-12 opacity-50" />
									<p className="text-muted-foreground">
										{isOwnProfile
											? "Aún no has hecho ningún commit. ¡Comparte algo!"
											: `${user.name} aún no ha hecho commits.`}
									</p>
									{isOwnProfile && (
										<Button asChild className="mt-4">
											<Link href="/">Hacer mi primer commit</Link>
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
