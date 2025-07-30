"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function createPatch(formData: FormData) {
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

		await prisma.patch.create({
			data: {
				content: content.trim(),
				authorId: session.user.id,
				commitId,
			},
		});

		revalidatePath(`/commits/${commitId}`);

		return { successMessage: "Patch creado exitosamente" };
	} catch (error) {
		console.error("Error creating patch:", error);
		return { errorMessage: "Error al crear el patch" };
	}
}
