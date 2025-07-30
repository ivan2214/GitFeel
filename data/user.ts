"use server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { User } from "@/lib/types";

export async function getCurrentUser(): Promise<User | null> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return null;
		}

		const user = await prisma.user.findUnique({
			where: {
				id: session.user.id,
			},
		});

		if (!user) {
			return null;
		}

		return user;
	} catch (error) {
		console.log(error);
		return null;
	}
}
