import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/data/user";
import { updateProfile } from "@/lib/actions/users";

export default async function ProfilePage() {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		redirect("/auth/signin");
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<div className="space-y-6">
					<div className="flex items-center gap-4">
						<Button asChild size="sm" variant="ghost">
							<Link className="flex items-center gap-2" href={`/dev/${currentUser.id}`}>
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
									"use server";
									await updateProfile(formData);
								}}
								className="space-y-6"
							>
								<div className="flex items-center gap-6">
									<Avatar className="h-20 w-20">
										<AvatarImage src={currentUser.image || ""} />
										<AvatarFallback className="text-xl">{currentUser.name?.charAt(0).toUpperCase()}</AvatarFallback>
									</Avatar>
									<div className="flex-1">
										<p className="text-muted-foreground text-sm">
											La imagen de perfil se sincroniza automáticamente con tu proveedor de autenticación.
										</p>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="name">Nombre</Label>
										<Input defaultValue={currentUser.name || ""} id="name" name="name" placeholder="Tu nombre completo" />
									</div>

									<div className="space-y-2">
										<Label htmlFor="username">Username</Label>
										<Input
											defaultValue={currentUser.username || ""}
											disabled
											id="username"
											name="username"
											placeholder="tu_username"
										/>
										<p className="text-muted-foreground text-xs">El username no se puede cambiar por ahora</p>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="bio">Bio (README)</Label>
									<Textarea
										className="min-h-[100px]"
										defaultValue={currentUser.bio || ""}
										id="bio"
										maxLength={160}
										name="bio"
										placeholder="Cuéntanos sobre ti, tu stack, tus frustraciones favoritas..."
									/>
									<p className="text-muted-foreground text-xs">Máximo 160 caracteres</p>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="location">Ubicación</Label>
										<Input defaultValue={currentUser.location || ""} id="location" name="location" placeholder="Ciudad, País" />
									</div>

									<div className="space-y-2">
										<Label htmlFor="website">Website</Label>
										<Input
											defaultValue={currentUser.website || ""}
											id="website"
											name="website"
											placeholder="https://tu-website.com"
											type="url"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="githubUrl">GitHub</Label>
										<Input
											defaultValue={currentUser.githubUrl || ""}
											id="githubUrl"
											name="githubUrl"
											placeholder="https://github.com/tu-usuario"
											type="url"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="twitterUrl">Twitter</Label>
										<Input
											defaultValue={currentUser.twitterUrl || ""}
											id="twitterUrl"
											name="twitterUrl"
											placeholder="https://twitter.com/tu-usuario"
											type="url"
										/>
									</div>
								</div>

								<div className="flex justify-end gap-3">
									<Button asChild variant="outline">
										<Link href={`/dev/${currentUser.id}`}>Cancelar</Link>
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
