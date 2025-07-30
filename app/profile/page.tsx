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
						<Button asChild variant="ghost" size="sm">
							<Link
								href={`/dev/${currentUser.id}`}
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
									"use server";
									await updateProfile(formData);
								}}
								className="space-y-6"
							>
								<div className="flex items-center gap-6">
									<Avatar className="h-20 w-20">
										<AvatarImage src={currentUser.image || ""} />
										<AvatarFallback className="text-xl">
											{currentUser.name?.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1">
										<p className="text-muted-foreground text-sm">
											La imagen de perfil se sincroniza automáticamente con tu
											proveedor de autenticación.
										</p>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="name">Nombre</Label>
										<Input
											id="name"
											name="name"
											defaultValue={currentUser.name || ""}
											placeholder="Tu nombre completo"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="username">Username</Label>
										<Input
											id="username"
											name="username"
											defaultValue={currentUser.username || ""}
											placeholder="tu_username"
											disabled
										/>
										<p className="text-muted-foreground text-xs">
											El username no se puede cambiar por ahora
										</p>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="bio">Bio (README)</Label>
									<Textarea
										id="bio"
										name="bio"
										defaultValue={currentUser.bio || ""}
										placeholder="Cuéntanos sobre ti, tu stack, tus frustraciones favoritas..."
										className="min-h-[100px]"
										maxLength={160}
									/>
									<p className="text-muted-foreground text-xs">
										Máximo 160 caracteres
									</p>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="location">Ubicación</Label>
										<Input
											id="location"
											name="location"
											defaultValue={currentUser.location || ""}
											placeholder="Ciudad, País"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="website">Website</Label>
										<Input
											id="website"
											name="website"
											type="url"
											defaultValue={currentUser.website || ""}
											placeholder="https://tu-website.com"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="githubUrl">GitHub</Label>
										<Input
											id="githubUrl"
											name="githubUrl"
											type="url"
											defaultValue={currentUser.githubUrl || ""}
											placeholder="https://github.com/tu-usuario"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="twitterUrl">Twitter</Label>
										<Input
											id="twitterUrl"
											name="twitterUrl"
											type="url"
											defaultValue={currentUser.twitterUrl || ""}
											placeholder="https://twitter.com/tu-usuario"
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
