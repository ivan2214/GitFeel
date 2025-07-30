"use client";

import { Chrome, Github, LogIn, MessageSquare, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { signIn } from "@/lib/auth-client";

export function AuthModals() {
	const [signInOpen, setSignInOpen] = useState(false);
	const [signUpOpen, setSignUpOpen] = useState(false);

	const handleSocialSignIn = async (
		provider: "github" | "google" | "discord",
	) => {
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
			<Dialog open={signInOpen} onOpenChange={setSignInOpen}>
				<DialogTrigger asChild>
					<Button variant="ghost" size="sm" className="flex items-center gap-2">
						<LogIn className="h-4 w-4" />
						<span className="hidden sm:inline">Iniciar Sesión</span>
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-center">Iniciar Sesión</DialogTitle>
						<DialogDescription className="text-center">
							Elige tu método preferido para acceder a gitfeel
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<Button
							onClick={() => handleSocialSignIn("github")}
							className="flex w-full items-center gap-2"
							variant="outline"
						>
							<Github className="h-4 w-4" />
							Continuar con GitHub
						</Button>

						<Button
							onClick={() => handleSocialSignIn("google")}
							className="flex w-full items-center gap-2"
							variant="outline"
						>
							<Chrome className="h-4 w-4" />
							Continuar con Google
						</Button>

						<Button
							onClick={() => handleSocialSignIn("discord")}
							className="flex w-full items-center gap-2"
							variant="outline"
						>
							<MessageSquare className="h-4 w-4" />
							Continuar con Discord
						</Button>

						<div className="text-center text-muted-foreground text-sm">
							¿No tienes cuenta?{" "}
							<Button
								onClick={() => {
									setSignInOpen(false);
									setSignUpOpen(true);
								}}
								variant="link"
								className="text-primary hover:underline"
							>
								Regístrate aquí
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Sign Up Modal */}
			<Dialog open={signUpOpen} onOpenChange={setSignUpOpen}>
				<DialogTrigger asChild>
					<Button size="sm" className="flex items-center gap-2">
						<UserPlus className="h-4 w-4" />
						<span className="hidden sm:inline">Registrarse</span>
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-center">Crear Cuenta</DialogTitle>
						<DialogDescription className="text-center">
							Únete a la comunidad de developers y comparte tus commits
							emocionales
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<Button
							onClick={() => handleSocialSignIn("github")}
							className="flex w-full items-center gap-2"
							variant="outline"
						>
							<Github className="h-4 w-4" />
							Registrarse con GitHub
						</Button>

						<Button
							onClick={() => handleSocialSignIn("google")}
							className="flex w-full items-center gap-2"
							variant="outline"
						>
							<Chrome className="h-4 w-4" />
							Registrarse con Google
						</Button>

						<Button
							onClick={() => handleSocialSignIn("discord")}
							className="flex w-full items-center gap-2"
							variant="outline"
						>
							<MessageSquare className="h-4 w-4" />
							Registrarse con Discord
						</Button>

						<div className="text-center text-muted-foreground text-sm">
							¿Ya tienes cuenta?{" "}
							<Button
								onClick={() => {
									setSignUpOpen(false);
									setSignInOpen(true);
								}}
								variant="link"
								className="text-primary hover:underline"
							>
								Inicia sesión
							</Button>
						</div>
					</div>

					<div className="border-t pt-4 text-center text-muted-foreground text-xs">
						Al registrarte, aceptas nuestros términos de servicio y política de
						privacidad.
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
