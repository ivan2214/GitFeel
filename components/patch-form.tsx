"use client";

import { Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createPatch } from "@/lib/actions/patches";

/**
 * Interfaz para las propiedades del componente PatchForm
 */
interface PatchFormProps {
	/** ID del commit al que se asociará el patch */
	commitId: string;
	/** Información del usuario actual */
	user: {
		id: string;
		name: string | null;
		image: string | null;
	};
}

/**
 * Componente de formulario para crear patches en commits
 * Permite a los usuarios autenticados agregar comentarios y sugerencias
 *
 * @param commitId - ID del commit al que se asociará el patch
 * @param user - Información del usuario actual
 * @returns Formulario para crear patches
 */
export function PatchForm({ commitId, user }: PatchFormProps) {
	return (
		<form
			action={async (formData) => {
				await createPatch(formData);
			}}
			className="space-y-4"
		>
			<input name="commitId" type="hidden" value={commitId} />
			<div className="flex gap-3">
				<Avatar className="h-8 w-8 ring-2 ring-primary/20">
					<AvatarImage src={user.image || ""} />
					<AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
						{user.name?.charAt(0).toUpperCase()}
					</AvatarFallback>
				</Avatar>
				<div className="flex-1 space-y-3">
					<div className="code-block">
						<div className="mb-2 flex items-center gap-2 text-cyan-400">
							<span className="text-green-400">$</span>
							<span className="text-sm">git add patch</span>
						</div>
						<Textarea
							className="min-h-[80px] resize-none border-blue-500/30 border-l-2 border-none bg-transparent pl-4 font-mono text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
							name="content"
							placeholder="Share your thoughts, suggestions, or experiences..."
							required
						/>
					</div>
					<div className="flex justify-end">
						<Button className="gitfeel-button flex items-center gap-2" size="sm" type="submit">
							<Send className="h-4 w-4" />
							Send Patch
						</Button>
					</div>
				</div>
			</div>
		</form>
	);
}
