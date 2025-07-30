import { ArrowLeft, User } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/users";
import { auth } from "@/lib/auth";

export default async function ProfilePage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/auth/signin");
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8 max-w-2xl">
				<div className="space-y-6">
					<div className="flex items-center gap-4">
						<Button asChild variant="ghost" size="sm">
							<Link
								href={`/dev/${session.user.id}`}
								className="flex items-center gap-2"
							>
								<ArrowLeft className="h-4 w-4" />
								Volver al perfil
							</Link>
						</Button>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<User className="h-5 w-5" />
								Editar Perfil
							</CardTitle>
						</CardHeader>
						<CardContent>
							<form
								action={async (formData) => {
									await updateProfile(formData);
								}}
								className="space-y-6"
							>
								<div className="flex items-center gap-6">
									<Avatar className="h-20 w-20">
										<AvatarImage src={session.user.image || ""} />
										<AvatarFallback className="text-xl">
											{session.user.name?.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1">
										<p className="text-sm text-muted-foreground">
											La imagen de perfil se sincroniza automáticamente con tu
											proveedor de autenticación.
										</p>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="name">Nombre</Label>
										<Input
											id="name"
											name="name"
											defaultValue={session.user.name || ""}
											placeholder="Tu nombre completo"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="username">Username</Label>
										<Input
											id="username"
											name="username"
											defaultValue={session.user.username || ""}
											placeholder="tu_username"
											disabled
										/>
										<p className="text-xs text-muted-foreground">
											El username no se puede cambiar por ahora
										</p>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="bio">Bio (README)</Label>
									<Textarea
										id="bio"
										name="bio"
										defaultValue={session.user.bio || ""}
										placeholder="Cuéntanos sobre ti, tu stack, tus frustraciones favoritas..."
										className="min-h-[100px]"
										maxLength={160}
									/>
									<p className="text-xs text-muted-foreground">
										Máximo 160 caracteres
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="location">Ubicación</Label>
										<Input
											id="location"
											name="location"
											defaultValue={session.user.location || ""}
											placeholder="Ciudad, País"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="website">Website</Label>
										<Input
											id="website"
											name="website"
											type="url"
											defaultValue={session.user.website || ""}
											placeholder="https://tu-website.com"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="githubUrl">GitHub</Label>
										<Input
											id="githubUrl"
											name="githubUrl"
											type="url"
											defaultValue={session.user.githubUrl || ""}
											placeholder="https://github.com/tu-usuario"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="twitterUrl">Twitter</Label>
										<Input
											id="twitterUrl"
											name="twitterUrl"
											type="url"
											defaultValue={session.user.twitterUrl || ""}
											placeholder="https://twitter.com/tu-usuario"
										/>
									</div>
								</div>

								<div className="flex justify-end gap-3">
									<Button asChild variant="outline">
										<Link href={`/dev/${session.user.id}`}>Cancelar</Link>
									</Button>
									<Button type="submit">Guardar Cambios</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
