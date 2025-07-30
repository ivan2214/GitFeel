import { ArrowLeft, Code, Info, Save } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/data/user";
import { updateProfile } from "@/lib/actions/users";

export default async function ProfilePage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/signin");
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<div className="space-y-6">
					{/* Navigation */}
					<div className="flex items-center gap-4">
						<Button asChild size="sm" variant="ghost">
							<Link className="flex items-center gap-2" href={`/dev/${user.id}`}>
								<ArrowLeft className="h-4 w-4" />
								Back to profile
							</Link>
						</Button>
					</div>

					{/* Profile Settings */}
					<Card className="commit-card">
						<div className="commit-header">
							<Code className="h-3 w-3" />
							<span>profile configuration</span>
							<span className="ml-auto">@{user.username}</span>
						</div>
						<CardContent className="p-6">
							<form
								action={async (formData) => {
									"use server";
									await updateProfile(formData);
								}}
								className="space-y-6"
							>
								{/* Avatar Section */}
								<div className="flex items-center gap-6 rounded-lg bg-muted/30 p-4">
									<div className="relative">
										<div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-75 blur"></div>
										<Avatar className="relative h-20 w-20 ring-4 ring-primary/20">
											<AvatarImage src={user.image || ""} />
											<AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl">
												{user.name?.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
									</div>
									<div className="flex-1">
										<h3 className="mb-1 font-medium">Profile Picture</h3>
										<p className="text-muted-foreground text-sm">
											Your profile picture is synced from your authentication provider.
										</p>
									</div>
								</div>

								{/* Basic Info */}
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="name">Display Name</Label>
										<Input
											className="border-border bg-muted/50"
											defaultValue={user.name || ""}
											id="name"
											name="name"
											placeholder="Your display name"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="username">Username</Label>
										<Input
											className="border-border bg-muted/30 opacity-60"
											defaultValue={user.username || ""}
											disabled
											id="username"
											name="username"
											placeholder="your_username"
										/>
										<p className="flex items-center gap-1 text-muted-foreground text-xs">
											<Info className="h-3 w-3" />
											Username cannot be changed
										</p>
									</div>
								</div>

								{/* Bio */}
								<div className="space-y-2">
									<Label htmlFor="bio">Bio (README.md)</Label>
									<div className="code-block">
										<div className="mb-2 flex items-center gap-2 text-cyan-400">
											<span className="text-green-400">$</span>
											<span className="text-sm">vim README.md</span>
										</div>
										<Textarea
											className="min-h-[100px] resize-none border-blue-500/30 border-l-2 border-none bg-transparent pl-4 font-mono text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
											defaultValue={user.bio || ""}
											id="bio"
											maxLength={160}
											name="bio"
											placeholder="Tell us about yourself, your stack, favorite bugs..."
										/>
									</div>
									<p className="text-muted-foreground text-xs">Maximum 160 characters</p>
								</div>

								{/* Location & Website */}
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="location">Location</Label>
										<Input
											className="border-border bg-muted/50"
											defaultValue={user.location || ""}
											id="location"
											name="location"
											placeholder="City, Country"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="website">Website</Label>
										<Input
											className="border-border bg-muted/50"
											defaultValue={user.website || ""}
											id="website"
											name="website"
											placeholder="https://your-website.com"
											type="url"
										/>
									</div>
								</div>

								{/* Social Links */}
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="githubUrl">GitHub</Label>
										<Input
											className="border-border bg-muted/50"
											defaultValue={user.githubUrl || ""}
											id="githubUrl"
											name="githubUrl"
											placeholder="https://github.com/your-username"
											type="url"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="twitterUrl">Twitter</Label>
										<Input
											className="border-border bg-muted/50"
											defaultValue={user.twitterUrl || ""}
											id="twitterUrl"
											name="twitterUrl"
											placeholder="https://twitter.com/your-username"
											type="url"
										/>
									</div>
								</div>

								{/* Actions */}
								<div className="flex justify-end gap-3 border-border border-t pt-4">
									<Button asChild variant="outline">
										<Link href={`/dev/${user.id}`}>Cancel</Link>
									</Button>
									<Button className="gitfeel-button flex items-center gap-2" type="submit">
										<Save className="h-4 w-4" />
										Save Changes
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>

					{/* Tips */}
					<Card className="commit-card">
						<div className="commit-header">
							<Info className="h-3 w-3" />
							<span>profile tips</span>
						</div>
						<CardContent className="p-4">
							<div className="code-block">
								<div className="space-y-2 text-sm">
									<p className="text-cyan-400"># Pro tips for your gitfeel profile:</p>
									<p className="text-slate-300">• Write a bio that shows your personality</p>
									<p className="text-slate-300">• Link your GitHub to show your work</p>
									<p className="text-slate-300">• Use your location to connect with local devs</p>
									<p className="text-slate-300">• Share your website or portfolio</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
