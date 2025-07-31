"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { ToggleFollowState, UpdateProfileState } from "@/lib/types";
import { type ProfileFormInput, ProfileSchema } from "@/schemas/profile";
import type { Locale } from "../dictionaries";
import { createNotification } from "./notifications"; // Import notification action

export async function updateProfile(
	_prevState: UpdateProfileState,
	{ data, lang }: { data: ProfileFormInput; lang: Locale },
): Promise<UpdateProfileState> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return { errorMessage: "Debes estar autenticado" };
		}

		console.log(data);

		const validateFields = ProfileSchema.safeParse(data);

		if (!validateFields.success) {
			const error = validateFields.error;
			console.log(error);

			return { errorMessage: `Error al procesar los datos ${error.message}` };
		}

		const { name, bio, location, website, githubUrl, twitterUrl, username } = validateFields.data;

		await prisma.user.update({
			where: { id: session.user.id },
			data: {
				name: name?.trim() || session.user.name,
				bio: bio?.trim() || null,
				location: location?.trim() || null,
				website: website?.trim() || null,
				githubUrl: githubUrl?.trim() || null,
				twitterUrl: twitterUrl?.trim() || null,
				username: username?.trim() || session.user.username,
			},
		});

		revalidatePath(`/${lang}/profile`);
		revalidatePath(`/${lang}/dev/${session.user.id}`);
		return { successMessage: "Perfil actualizado correctamente" };
	} catch (error) {
		console.error("Error updating profile:", error);
		return { errorMessage: "Error al procesar los datos" };
	}
}

export async function toggleFollow(userId: string): Promise<ToggleFollowState> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return { errorMessage: "Debes estar autenticado" };
		}

		if (session.user.id === userId) {
			return { errorMessage: "No puedes seguirte a ti mismo" };
		}

		const existingFollow = await prisma.follow.findUnique({
			where: {
				followerId_followingId: {
					followerId: session.user.id,
					followingId: userId,
				},
			},
		});

		if (existingFollow) {
			await prisma.follow.delete({
				where: { id: existingFollow.id },
			});
		} else {
			await prisma.follow.create({
				data: {
					followerId: session.user.id,
					followingId: userId,
				},
			});

			// Notify the user being followed
			await createNotification({
				recipientId: userId,
				type: "NEW_FOLLOWER",
				message: `${session.user.name} te ha empezado a seguir.`,
				link: `/dev/${session.user.id}`,
			});
		}

		revalidatePath(`/dev/${userId}`);

		return {
			successMessage: existingFollow ? "Dejaste de seguir" : "Ahora sigues a este developer",
		};
	} catch (error) {
		console.error("Error toggling follow:", error);
		return { errorMessage: "Error al procesar la acción" };
	}
}
