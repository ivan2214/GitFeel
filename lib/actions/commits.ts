"use server";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { Prisma } from "@/app/generated/prisma";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { CommitWithDetails, CreateCommitState, CreateForkState, ForkWithDetails, ToggleStarState, ToggleStashState } from "@/lib/types";
import { createNotification } from "./notifications"; // Import notification action

const google = createGoogleGenerativeAI({
	// custom settings
	apiKey: process.env.GOOGLE_API_KEY,
});

const model = google("gemini-2.5-flash");

export async function createCommit(_prevState: CreateCommitState, formData: FormData): Promise<CreateCommitState> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return { errorMessage: "Debes estar autenticado para hacer un commit" };
		}

		const content = formData.get("content") as string;
		const imageUrl = formData.get("imageUrl") as string;
		const tagNames = formData.get("tags") as string;

		if (!content?.trim()) {
			return { errorMessage: "El contenido del commit no puede estar vacío" };
		}

		if (content.length > 280) {
			return { errorMessage: "El commit no puede tener más de 280 caracteres" };
		}

		// Create the commit
		const commit = await prisma.commit.create({
			data: {
				content: content.trim(),
				imageUrl: imageUrl || null,
				authorId: session.user.id,
			},
		});

		// Process tags if provided
		if (tagNames?.trim()) {
			const tags = tagNames
				.split(",")
				.map((tag) => tag.trim().toLowerCase())
				.filter(Boolean);

			for (const tagName of tags) {
				// Find or create tag
				let tag = await prisma.tag.findUnique({
					where: { name: tagName },
				});

				if (!tag) {
					tag = await prisma.tag.create({
						data: { name: tagName },
					});
				}

				// Link tag to commit
				await prisma.commitTag.create({
					data: {
						commitId: commit.id,
						tagId: tag.id,
					},
				});
			}
		}

		revalidatePath("/");
		revalidatePath("/commits");

		return {
			successMessage: "Commit publicado exitosamente",
			commitId: commit.id,
		};
	} catch (error) {
		console.error("Error creating commit:", error);
		return { errorMessage: "Error al crear el commit" };
	}
}

export async function suggestTags(content: string): Promise<string[]> {
	try {
		if (!content?.trim() || content.length < 10) {
			return [];
		}

		const { text } = await generateText({
			model,
			system: `Eres un asistente que sugiere tags para posts de desarrolladores. 
      Analiza el contenido y sugiere entre 1-3 tags relevantes en español, 
      relacionados con programación, tecnología, emociones de developers, etc.
      Responde solo con los tags separados por comas, sin explicaciones.
      Ejemplos: javascript, frustración, debugging, react, burnout, aprendizaje`,
			prompt: `Sugiere tags para este post de developer: "${content}"`,
		});

		return text
			.split(",")
			.map((tag) => tag.trim().toLowerCase())
			.filter(Boolean)
			.slice(0, 3);
	} catch (error) {
		console.error("Error suggesting tags:", error);
		return [];
	}
}

export async function toggleStar(_prevState: ToggleStarState, commitId: string): Promise<ToggleStarState> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return { errorMessage: "Debes estar autenticado" };
		}

		const existingStar = await prisma.star.findUnique({
			where: {
				userId_commitId: {
					userId: session.user.id,
					commitId,
				},
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

		if (existingStar) {
			await prisma.star.delete({
				where: { id: existingStar.id },
			});
		} else {
			const star = await prisma.star.create({
				data: {
					userId: session.user.id,
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

			// Notify commit author about the new star
			const commitAuthorId =
				star?.commit.authorId || (await prisma.commit.findUnique({ where: { id: commitId }, select: { authorId: true } }))?.authorId;
			if (session.user.id !== commitAuthorId && commitAuthorId) {
				await createNotification({
					recipientId: commitAuthorId,
					type: "COMMIT_STAR",
					message: `${session.user.name} le dio star a tu commit: "${star?.commit.content.slice(0, 50) || (await prisma.commit.findUnique({ where: { id: commitId }, select: { content: true } }))?.content.slice(0, 50)}..."`,
					link: `/commits/${commitId}`,
				});
			}
		}

		revalidatePath("/");
		revalidatePath("/commits");
		revalidatePath(`/commits/${commitId}`);

		return { successMessage: existingStar ? "Star removido" : "Star agregado" };
	} catch (error) {
		console.error("Error toggling star:", error);
		return { errorMessage: "Error al procesar la acción" };
	}
}

export async function toggleStash(_prevState: ToggleStashState, commitId: string): Promise<ToggleStashState> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return { errorMessage: "Debes estar autenticado" };
		}

		const existingStash = await prisma.stash.findUnique({
			where: {
				userId_commitId: {
					userId: session.user.id,
					commitId,
				},
			},
		});

		if (existingStash) {
			await prisma.stash.delete({
				where: { id: existingStash.id },
			});
		} else {
			await prisma.stash.create({
				data: {
					userId: session.user.id,
					commitId,
				},
			});
		}

		revalidatePath("/");
		revalidatePath("/commits");
		revalidatePath(`/commits/${commitId}`);

		return {
			successMessage: existingStash ? "Removido del stash" : "Agregado al stash",
		};
	} catch (error) {
		console.error("Error toggling stash:", error);
		return { errorMessage: "Error al procesar la acción" };
	}
}

export async function createFork(
	_prevState: CreateForkState,
	{
		commitId,
		content,
	}: {
		commitId: string;
		content?: string;
	},
): Promise<CreateForkState> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return { errorMessage: "Debes estar autenticado" };
		}

		const existingFork = await prisma.fork.findUnique({
			where: {
				userId_commitId: {
					userId: session.user.id,
					commitId,
				},
			},
		});

		if (existingFork) {
			return { errorMessage: "Ya has forkeado este commit" };
		}

		const fork = await prisma.fork.create({
			data: {
				userId: session.user.id,
				commitId,
				content: content || null,
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

		// Notify commit author about the new fork
		if (session.user.id !== fork.commit.authorId) {
			// Only notify if not self-forking
			await createNotification({
				recipientId: fork.commit.authorId,
				type: "COMMIT_FORK",
				message: `${session.user.name} forkeó tu commit: "${fork.commit.content.slice(0, 50)}..."`,
				link: `/commits/${commitId}`,
			});
		}

		revalidatePath("/");
		revalidatePath("/commits");
		revalidatePath(`/commits/${commitId}`);

		return { successMessage: "Commit forkeado exitosamente" };
	} catch (error) {
		console.error("Error creating fork:", error);
		return { errorMessage: "Error al forkear el commit" };
	}
}

// Nueva función para obtener commits con forks
export async function getCommitsWithForks(options: {
	tags?: string[];
	query?: string;
	sortBy?: "recent" | "popular" | "stars" | "forks";
	limit?: number;
	offset?: number;
}): Promise<{
	commits: CommitWithDetails[];
	forks: ForkWithDetails[];
}> {
	const { tags, query, sortBy = "recent", limit = 20, offset = 0 } = options;

	const where: Prisma.CommitWhereInput = {};

	if (tags && tags.length > 0) {
		where.OR = [
			{
				tags: {
					some: {
						tag: {
							name: {
								in: tags,
							},
						},
					},
				},
			},
			{
				forks: {
					some: {
						commit: {
							tags: {
								some: {
									tag: {
										name: {
											in: tags,
										},
									},
								},
							},
						},
					},
				},
			},
		];
	}

	if (query) {
		const searchCondition = {
			content: {
				contains: query,
				mode: "insensitive" as const,
			},
		};

		if (where.OR) {
			where.AND = [
				{ OR: where.OR },
				{
					OR: [
						searchCondition,
						{
							forks: {
								some: searchCondition,
							},
						},
					],
				},
			];
			delete where.OR;
		} else {
			where.OR = [
				searchCondition,
				{
					forks: {
						some: searchCondition,
					},
				},
			];
		}
	}

	let orderBy: Prisma.CommitOrderByWithRelationInput | Prisma.CommitOrderByWithRelationInput[];

	switch (sortBy) {
		case "recent":
			orderBy = { createdAt: "desc" };
			break;
		case "popular":
			orderBy = [{ stars: { _count: "desc" } }, { forks: { _count: "desc" } }, { patches: { _count: "desc" } }];
			break;
		case "stars":
			orderBy = { stars: { _count: "desc" } };
			break;
		case "forks":
			orderBy = { forks: { _count: "desc" } };
			break;
		default:
			orderBy = { createdAt: "desc" };
			break;
	}

	// Get original commits
	const commits = await prisma.commit.findMany({
		where,
		include: {
			author: true,
			tags: {
				include: {
					tag: true,
				},
			},
			_count: {
				select: {
					patches: true,
					stars: true,
					stashes: true,
					forks: true,
				},
			},
		},
		orderBy,
		take: limit,
		skip: offset,
	});

	// Get forks as separate posts
	const forks = await prisma.fork.findMany({
		where: {
			commit: where,
		},
		include: {
			user: true,
			commit: {
				include: {
					author: true,
					tags: {
						include: {
							tag: true,
						},
					},
					_count: {
						select: {
							patches: true,
							stars: true,
							stashes: true,
							forks: true,
						},
					},
				},
			},
			tags: {
				include: {
					tag: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
		take: limit,
		skip: offset,
	});

	return { commits, forks };
}
