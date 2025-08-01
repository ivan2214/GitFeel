"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { CreatePatchState } from "@/lib/types";
import type { Locale } from "../dictionaries";
import { createNotification } from "./notifications"; // Import notification action

export async function createPatch(formData: FormData, lang: Locale): Promise<CreatePatchState> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return { errorMessage: "Debes estar autenticado para crear un patch" };
		}

		const content = formData.get("content") as string;
		const commitId = formData.get("commitId") as string;

		if (!content?.trim()) {
			return { errorMessage: "El contenido del patch no puede estar vacío" };
		}

		if (!commitId) {
			return { errorMessage: "ID del commit requerido" };
		}

		const patch = await prisma.patch.create({
			data: {
				content: content.trim(),
				authorId: session.user.id,
				commitId,
			},
			include: {
				commit: {
					select: {
						authorId: true,
						content: true,
					},
				},
			},
		});

		// Notify commit author about the new patch
		if (session.user.id !== patch.commit.authorId) {
			// Only notify if not self-patching
			await createNotification({
				recipientId: patch.commit.authorId,
				type: "COMMIT_PATCH",
				message: `${session.user.name} comentó en tu commit: "${patch.commit.content.slice(0, 50)}..."`,
				link: `/${lang}/commits/${commitId}`,
			});
		}

		revalidatePath(`/${lang}/commits/${commitId}`);

		return { successMessage: "Patch creado exitosamente" };
	} catch (error) {
		console.error("Error creating patch:", error);
		return { errorMessage: "Error al crear el patch" };
	}
}
