"use client";

import { Chrome, Github, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/lib/auth-client";

export default function SignUpPage() {
	const handleSocialSignIn = async (
		provider: "github" | "google" | "discord",
	) => {
		await signIn.social({
			provider,
			callbackURL: "/",
		});
	};

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="w-full max-w-md space-y-6">
				<div className="text-center space-y-2">
					<h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
						gitfeel
					</h1>
					<p className="text-muted-foreground">
						Comparte tus commits emocionales
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="text-center">Crear Cuenta</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<Button
							onClick={() => handleSocialSignIn("github")}
							className="w-full flex items-center gap-2"
							variant="outline"
						>
							<Github className="h-4 w-4" />
							Registrarse con GitHub
						</Button>

						<Button
							onClick={() => handleSocialSignIn("google")}
							className="w-full flex items-center gap-2"
							variant="outline"
						>
							<Chrome className="h-4 w-4" />
							Registrarse con Google
						</Button>

						<Button
							onClick={() => handleSocialSignIn("discord")}
							className="w-full flex items-center gap-2"
							variant="outline"
						>
							<MessageSquare className="h-4 w-4" />
							Registrarse con Discord
						</Button>

						<div className="text-center text-sm text-muted-foreground">
							¿Ya tienes cuenta?{" "}
							<Link
								href="/auth/signin"
								className="text-blue-500 hover:underline"
							>
								Inicia sesión
							</Link>
						</div>

						<div className="text-center">
							<Link href="/" className="text-sm text-blue-500 hover:underline">
								Volver al inicio
							</Link>
						</div>
					</CardContent>
				</Card>

				<div className="text-center text-xs text-muted-foreground">
					Al registrarte, aceptas nuestros términos de servicio y política de
					privacidad.
				</div>
			</div>
		</div>
	);
}
