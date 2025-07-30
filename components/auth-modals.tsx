"use client";

import { Chrome, Code2, Github, LogIn, MessageSquare, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { signIn } from "@/lib/auth-client";

export function AuthModals() {
	const [signInOpen, setSignInOpen] = useState(false);
	const [signUpOpen, setSignUpOpen] = useState(false);

	const handleSocialSignIn = async (provider: "github" | "google" | "discord") => {
		try {
			await signIn.social({
				provider,
				callbackURL: "/",
			});
			setSignInOpen(false);
			setSignUpOpen(false);
		} catch (error) {
			console.error("Error signing in:", error);
		}
	};

	return (
		<div className="flex items-center gap-2">
			{/* Sign In Modal */}
			<Dialog onOpenChange={setSignInOpen} open={signInOpen}>
				<DialogTrigger asChild>
					<Button className="flex items-center gap-2" size="sm" variant="ghost">
						<LogIn className="h-4 w-4" />
						<span className="hidden sm:inline">Sign In</span>
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-md">
					<DialogHeader className="text-center">
						<div className="mb-4 flex justify-center">
							<div className="relative">
								<div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 opacity-75 blur"></div>
								<div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
									<Code2 className="h-6 w-6 text-white" />
								</div>
							</div>
						</div>
						<DialogTitle>Welcome back to gitfeel</DialogTitle>
						<DialogDescription>Sign in to share your developer feelings and connect with the community</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<Button
							className="flex w-full items-center gap-3 bg-[#24292e] text-white hover:bg-[#1a1e22]"
							onClick={() => handleSocialSignIn("github")}
							variant="outline"
						>
							<Github className="h-5 w-5" />
							Continue with GitHub
						</Button>

						<Button className="flex w-full items-center gap-3" onClick={() => handleSocialSignIn("google")} variant="outline">
							<Chrome className="h-5 w-5" />
							Continue with Google
						</Button>

						<Button
							className="flex w-full items-center gap-3 bg-[#5865f2] text-white hover:bg-[#4752c4]"
							onClick={() => handleSocialSignIn("discord")}
							variant="outline"
						>
							<MessageSquare className="h-5 w-5" />
							Continue with Discord
						</Button>

						<div className="border-t pt-4 text-center text-muted-foreground text-sm">
							Don't have an account?{" "}
							<Button
								className="font-medium text-primary hover:underline"
								onClick={() => {
									setSignInOpen(false);
									setSignUpOpen(true);
								}}
							>
								Sign up here
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Sign Up Modal */}
			<Dialog onOpenChange={setSignUpOpen} open={signUpOpen}>
				<DialogTrigger asChild>
					<Button className="gitfeel-button flex items-center gap-2" size="sm">
						<UserPlus className="h-4 w-4" />
						<span className="hidden sm:inline">Sign Up</span>
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-md">
					<DialogHeader className="text-center">
						<div className="mb-4 flex justify-center">
							<div className="relative">
								<div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 opacity-75 blur"></div>
								<div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
									<Code2 className="h-6 w-6 text-white" />
								</div>
							</div>
						</div>
						<DialogTitle>Join the gitfeel community</DialogTitle>
						<DialogDescription>Connect with developers worldwide and share your coding journey</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<Button
							className="flex w-full items-center gap-3 bg-[#24292e] text-white hover:bg-[#1a1e22]"
							onClick={() => handleSocialSignIn("github")}
							variant="outline"
						>
							<Github className="h-5 w-5" />
							Sign up with GitHub
						</Button>

						<Button className="flex w-full items-center gap-3" onClick={() => handleSocialSignIn("google")} variant="outline">
							<Chrome className="h-5 w-5" />
							Sign up with Google
						</Button>

						<Button
							className="flex w-full items-center gap-3 bg-[#5865f2] text-white hover:bg-[#4752c4]"
							onClick={() => handleSocialSignIn("discord")}
							variant="outline"
						>
							<MessageSquare className="h-5 w-5" />
							Sign up with Discord
						</Button>

						<div className="border-t pt-4 text-center text-muted-foreground text-sm">
							Already have an account?{" "}
							<Button
								className="font-medium text-primary hover:underline"
								onClick={() => {
									setSignUpOpen(false);
									setSignInOpen(true);
								}}
							>
								Sign in here
							</Button>
						</div>
					</div>

					<div className="border-t pt-4 text-center text-muted-foreground text-xs">
						By signing up, you agree to our terms of service and privacy policy.
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
