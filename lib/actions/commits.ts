"use server";

import { createGoogleGenerativeAI } from "@ai-sdk/google";

import { generateObject } from "ai";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import z from "zod";
import type { Prisma } from "@/app/generated/prisma";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { CommitWithDetails, CreateCommitState, CreateForkState, ForkWithDetails, ToggleStarState, ToggleStashState } from "@/lib/types";
import type { TagInput } from "@/schemas/profile";
import type { Locale } from "../dictionaries";
import { createNotification } from "./notifications"; // Import notification action

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

const suggestTagsSchema = z.object({
	tags: z
		.array(
			z.object({
				name: z.string().describe("El nombre de la etiqueta ligada a la descripcion"),
				color: z
					.string()
					.describe("El color de la etiqueta que sera de la forma de clases de tailwindcss por ejemplo : bg-emerald-500 text-white"),
			}),
		)
		.describe("Una lista de etiquetas que seran ligadas a la descripcion del commit"),
});

const google = createGoogleGenerativeAI({
	// custom settings
	apiKey: process.env.GOOGLE_API_KEY,
});

const model = google("gemini-2.5-flash");

/**
 * Sugiere etiquetas (tags) relevantes para el contenido de un commit usando IA
 * @param content - El contenido del commit para analizar
 * @param lang - El idioma para las etiquetas sugeridas
 * @returns Objeto con array de etiquetas sugeridas
 */
export async function suggestTags(content: string, lang: Locale) {
	try {
		if (!content?.trim() || content.length < 10) {
			return { tags: [] };
		}

		const { object: result } = await generateObject({
			model,
			system: `Eres un asistente que genera etiquetas para commits de desarrollo.

Tu tarea es analizar el contenido del commit y generar entre 1 y 5 etiquetas relevantes.

Debes devolver un objeto JSON con la siguiente estructura:
{
  "tags": [
    {"name": "nombre_etiqueta", "color": "bg-color-500 text-white"},
    {"name": "otra_etiqueta", "color": "bg-color-500 text-white"}
  ]
}

Cada etiqueta debe tener:
- name: nombre descriptivo de la etiqueta
- color: clases de TailwindCSS para el color (formato: "bg-[color]-500 text-white")

Idioma de las etiquetas: ${lang === "es" ? "español" : "inglés"}

Colores sugeridos:
- Frontend/UI: bg-blue-500 text-white
- Backend/API: bg-green-500 text-white
- Database: bg-purple-500 text-white
- Testing: bg-yellow-500 text-black
- Bug Fix: bg-red-500 text-white
- Feature: bg-indigo-500 text-white
- Documentation: bg-gray-500 text-white
- Performance: bg-orange-500 text-white

Genera etiquetas específicas y relevantes basadas en el contenido del commit.`,
			prompt: `Analiza este commit y genera etiquetas relevantes: "${content}"`,
			schema: suggestTagsSchema,
			experimental_repairText: async (options) => {
				const { text } = options;

				console.log("EXperimental repair text", text);

				try {
					// Intentar parsear si el texto viene como string JSON
					if (typeof text === "string") {
						let trimmedText = text.trim();
						console.log("Texto original:", trimmedText);

						// Caso especial: El texto es un string JSON escapado que contiene otro JSON
						if (trimmedText.startsWith('"') && trimmedText.endsWith('"')) {
							console.log("Detectado string JSON escapado");
							try {
								// Parsear el string externo para obtener el JSON interno
								trimmedText = JSON.parse(trimmedText);
								console.log("JSON desenescapado:", trimmedText);
							} catch (unescapeError) {
								console.log("Error al desenescapar:", unescapeError);
							}
						}

						// Caso 1: El texto es un objeto JSON que ya tiene la estructura correcta
						if (trimmedText.startsWith("{") && trimmedText.includes('"tags"')) {
							console.log("Detectado objeto con tags");
							const parsedObject = JSON.parse(trimmedText);

							// Verificar que tenga la estructura correcta
							if (parsedObject.tags && Array.isArray(parsedObject.tags)) {
								console.log("Estructura correcta encontrada", parsedObject);
								// Validar y limpiar las etiquetas
								const validTags = parsedObject.tags.filter((tag: TagInput) => tag.name && tag.color).slice(0, 5); // Limitar a 5 etiquetas máximo

								const cleanedObject = { tags: validTags };
								console.log("Objeto limpio devuelto", cleanedObject);
								return JSON.stringify(cleanedObject);
							}
						}

						// Caso 2: El texto es un array JSON directo
						if (trimmedText.startsWith("[")) {
							console.log("Detectado array directo");
							const parsedArray = JSON.parse(trimmedText);

							// Verificar que sea un array válido
							if (Array.isArray(parsedArray)) {
								// Convertir el array a la estructura esperada
								const fixedObject = {
									tags: parsedArray.map((item) => ({
										name: item.name || "",
										color: item.color || "bg-gray-500 text-white",
									})),
								};
								console.log("Array convertido a objeto", fixedObject);
								return JSON.stringify(fixedObject);
							}
						}
					}
				} catch (parseError) {
					console.error("Error al parsear en experimental_repairText:", parseError);
				}

				// Si no se puede reparar, devolver una estructura vacía válida
				console.log("Devolviendo estructura vacía por defecto");
				return JSON.stringify({ tags: [] });
			},
		});
		console.log(result);

		return {
			tags: (result as { tags: TagInput[] }).tags,
		};
	} catch (error) {
		console.error("Error suggesting tags:", error);
		return { tags: [] };
	}
}

export async function toggleStar(_prevState: ToggleStarState, { commitId, lang }: { commitId: string; lang: Locale }): Promise<ToggleStarState> {
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
					link: `/${lang}/commits/${commitId}`,
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
		tagNames,
		lang,
	}: {
		commitId: string;
		content?: string;
		tagNames?: TagInput[];
		lang: Locale;
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

		// Process tags for the fork if provided
		if (tagNames?.length) {
			const tags = tagNames.map((tag) => tag.name.toLowerCase()).filter(Boolean);

			for (const tagName of tags) {
				let tag = await prisma.tag.findUnique({
					where: { name: tagName },
				});

				if (!tag) {
					tag = await prisma.tag.create({
						data: { name: tagName },
					});
				}

				await prisma.forkTag.create({
					data: {
						forkId: fork.id,
						tagId: tag.id,
					},
				});
			}
		}

		// Notify commit author about the new fork
		if (session.user.id !== fork.commit.authorId) {
			// Only notify if not self-forking
			await createNotification({
				recipientId: fork.commit.authorId,
				type: "COMMIT_FORK",
				message: `${session.user.name} forkeó tu commit: "${fork.commit.content.slice(0, 50)}..."`,
				link: `/${lang}/commits/${commitId}`,
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

/**
 * Acción del servidor para cargar más commits y forks.
 * Esta función se utiliza para implementar la funcionalidad de infinite scroll
 * sin necesidad de usar una API route.
 */
export async function loadMoreCommits(options: {
	tags?: string[];
	query?: string;
	sortBy?: "recent" | "popular" | "stars" | "forks";
	offset: number;
	limit?: number;
}): Promise<{
	commits: CommitWithDetails[];
	forks: ForkWithDetails[];
	hasMore: boolean;
}> {
	try {
		const { commits, forks } = await getCommitsWithForks(options);
		// Determinar si hay más resultados disponibles
		const hasMore = commits.length > 0 || forks.length > 0;

		return { commits, forks, hasMore };
	} catch (error) {
		console.error("Error loading more commits:", error);
		return { commits: [], forks: [], hasMore: false };
	}
}
