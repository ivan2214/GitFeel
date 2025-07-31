import { faker } from "@faker-js/faker/locale/es";
import { PrismaClient } from "@/app/generated/prisma";
import type { Commit, Tag, User } from "@/lib/types";

const prisma = new PrismaClient();

// Número de registros a crear
const NUM_USERS = 10;
const NUM_COMMITS_PER_USER = 5;
const NUM_TAGS = 8;

async function main() {
	if (process.env.NODE_ENV === "production") return;

	console.log("🌱 Iniciando seed...");

	// Limpiar la base de datos
	await cleanDatabase();

	// Crear tags
	const tags = await createTags();
	console.log(`✅ Creados ${tags.length} tags`);

	// Crear usuarios
	const users = await createUsers();
	console.log(`✅ Creados ${users.length} usuarios`);

	// Crear relaciones de seguimiento
	await createFollows(users);
	console.log(`✅ Creadas relaciones de seguimiento`);

	// Crear commits para cada usuario
	const commits = await createCommits(users, tags);
	console.log(`✅ Creados ${commits.length} commits`);

	// Crear patches (comentarios)
	await createPatches(users, commits);
	console.log(`✅ Creados patches (comentarios)`);

	// Crear stars (likes)
	await createStars(users, commits);
	console.log(`✅ Creados stars (likes)`);

	// Crear stashes (guardados)
	await createStashes(users, commits);
	console.log(`✅ Creados stashes (guardados)`);

	// Crear forks (retweets)
	await createForks(users, commits, tags);
	console.log(`✅ Creados forks (retweets)`);

	// Crear notificaciones
	await createNotifications(users, commits);
	console.log(`✅ Creadas notificaciones`);

	console.log("✨ Seed completado con éxito!");
}

/**
 * Limpia la base de datos antes de crear nuevos registros
 */
async function cleanDatabase() {
	// Eliminar en orden para evitar problemas con las relaciones
	await prisma.notification.deleteMany();
	await prisma.forkTag.deleteMany();
	await prisma.fork.deleteMany();
	await prisma.stash.deleteMany();
	await prisma.star.deleteMany();
	await prisma.patch.deleteMany();
	await prisma.uploadedS3.deleteMany();
	await prisma.commitTag.deleteMany();

	// Primero actualizar los commits que son respuestas para eliminar la referencia
	await prisma.$executeRaw`UPDATE "commits" SET "branchId" = NULL WHERE "branchId" IS NOT NULL`;

	// Ahora sí podemos eliminar los commits
	await prisma.commit.deleteMany();

	await prisma.follow.deleteMany();
	await prisma.tag.deleteMany();
	await prisma.verification.deleteMany();
	await prisma.session.deleteMany();
	await prisma.account.deleteMany();
	await prisma.user.deleteMany();
}

/**
 * Crea tags para categorizar commits
 */
async function createTags() {
	const tagNames = ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "CSS", "Tailwind", "Prisma"];

	const tagColors = [
		"#3b82f6", // blue
		"#10b981", // green
		"#f59e0b", // amber
		"#ef4444", // red
		"#8b5cf6", // violet
		"#ec4899", // pink
		"#6366f1", // indigo
		"#14b8a6", // teal
	];

	const tags = [];

	for (let i = 0; i < tagNames.length; i++) {
		const tag = await prisma.tag.create({
			data: {
				name: tagNames[i],
				color: tagColors[i],
			},
		});
		tags.push(tag);
	}

	return tags;
}

/**
 * Crea usuarios de prueba
 */
async function createUsers() {
	const users = [];

	for (let i = 0; i < NUM_USERS; i++) {
		const firstName = faker.person.firstName();
		const lastName = faker.person.lastName();
		const username = faker.internet.username({ firstName, lastName }).toLowerCase();

		const user = await prisma.user.create({
			data: {
				name: `${firstName} ${lastName}`,
				email: faker.internet.email({ firstName, lastName }),
				emailVerified: faker.datatype.boolean(0.9), // 90% verificados
				image: faker.image.avatar(),
				username,
				bio: faker.lorem.paragraph(),
				location: faker.location.city(),
				website: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.6 }),
				githubUrl: faker.helpers.maybe(() => `https://github.com/${username}`, { probability: 0.7 }),
				twitterUrl: faker.helpers.maybe(() => `https://twitter.com/${username}`, { probability: 0.5 }),
				createdAt: faker.date.past({ years: 1 }),
			},
		});

		// Crear cuenta para autenticación
		await prisma.account.create({
			data: {
				userId: user.id,
				accountId: faker.string.uuid(),
				providerId: "github",
				accessToken: faker.string.alphanumeric(40),
				refreshToken: faker.string.alphanumeric(40),
				createdAt: user.createdAt,
				updatedAt: user.createdAt,
			},
		});

		users.push(user);
	}

	return users;
}

/**
 * Crea relaciones de seguimiento entre usuarios
 */
async function createFollows(users: User[]) {
	for (const follower of users) {
		// Cada usuario sigue a 1-5 usuarios aleatorios
		const numToFollow = faker.number.int({ min: 1, max: 5 });
		const shuffledUsers = faker.helpers.shuffle([...users]);

		for (let i = 0; i < numToFollow; i++) {
			const following = shuffledUsers[i];

			// No seguirse a sí mismo
			if (follower.id === following.id) continue;

			try {
				await prisma.follow.create({
					data: {
						followerId: follower.id,
						followingId: following.id,
						createdAt: faker.date.recent({ days: 30 }),
					},
				});
			} catch (error) {
				// Ignorar errores de duplicados (unique constraint)
				console.log(`Ya existe relación entre ${follower.id} y ${following.id}`);
			}
		}
	}
}

/**
 * Crea commits (posts) para los usuarios
 */
async function createCommits(users: User[], tags: Tag[]) {
	const commits: Commit[] = [];
	const uploadedImages = [];

	for (const user of users) {
		for (let i = 0; i < NUM_COMMITS_PER_USER; i++) {
			// Decidir si este commit es una respuesta a otro commit (thread/branch)
			const isReply = i > 0 && faker.datatype.boolean(0.3); // 30% de probabilidad
			let branchId = null;

			if (isReply && commits.length > 0) {
				// Seleccionar un commit aleatorio como padre
				const randomCommit = faker.helpers.arrayElement(commits);
				branchId = randomCommit.id;
			}

			// Decidir si tiene imagen
			const hasImage = faker.datatype.boolean(0.4); // 40% con imagen

			// Crear el commit
			const commit = await prisma.commit.create({
				data: {
					content: faker.lorem.paragraph({ min: 1, max: 3 }),
					authorId: user.id,
					branchId,
					createdAt: faker.date.recent({ days: 60 }),
					updatedAt: faker.date.recent({ days: 30 }),
				},
			});

			// Añadir imagen si corresponde
			if (hasImage) {
				const imageUrl = faker.image.url({ width: 640, height: 480 });
				const uploadedImage = await prisma.uploadedS3.create({
					data: {
						key: faker.string.uuid(),
						url: imageUrl,
						isMainImage: true,
						name: `image_${faker.string.alphanumeric(8)}.jpg`,
						size: faker.number.float({ min: 100, max: 5000 }),
						commitId: commit.id,
					},
				});
				uploadedImages.push(uploadedImage);
			}

			// Asignar 1-3 tags aleatorios
			const numTags = faker.number.int({ min: 1, max: 3 });
			const shuffledTags = faker.helpers.shuffle([...tags]);

			for (let j = 0; j < numTags; j++) {
				await prisma.commitTag.create({
					data: {
						commitId: commit.id,
						tagId: shuffledTags[j].id,
					},
				});
			}

			commits.push(commit);
		}
	}

	return commits;
}

/**
 * Crea patches (comentarios) para los commits
 */
async function createPatches(users: User[], commits: Commit[]) {
	for (const commit of commits) {
		// Cada commit tiene 0-5 comentarios
		const numPatches = faker.number.int({ min: 0, max: 5 });

		for (let i = 0; i < numPatches; i++) {
			// Seleccionar un usuario aleatorio como autor del comentario
			const randomUser = faker.helpers.arrayElement(users);

			await prisma.patch.create({
				data: {
					content: faker.lorem.sentences({ min: 1, max: 3 }),
					authorId: randomUser.id,
					commitId: commit.id,
					createdAt: faker.date.recent({ days: 30 }),
					updatedAt: faker.date.recent({ days: 15 }),
				},
			});
		}
	}
}

/**
 * Crea stars (likes) para los commits
 */
async function createStars(users: User[], commits: Commit[]) {
	for (const commit of commits) {
		// Cada commit tiene 0-8 likes
		const numStars = faker.number.int({ min: 0, max: 8 });
		const shuffledUsers = faker.helpers.shuffle([...users]);

		for (let i = 0; i < numStars && i < shuffledUsers.length; i++) {
			try {
				await prisma.star.create({
					data: {
						userId: shuffledUsers[i].id,
						commitId: commit.id,
						createdAt: faker.date.recent({ days: 20 }),
					},
				});
			} catch (error) {
				// Ignorar errores de duplicados (unique constraint)
				console.log(`Ya existe star entre ${shuffledUsers[i].id} y ${commit.id}`);
			}
		}
	}
}

/**
 * Crea stashes (guardados/bookmarks) para los commits
 */
async function createStashes(users: User[], commits: Commit[]) {
	for (const user of users) {
		// Cada usuario guarda 0-5 commits
		const numStashes = faker.number.int({ min: 0, max: 5 });
		const shuffledCommits = faker.helpers.shuffle([...commits]);

		for (let i = 0; i < numStashes && i < shuffledCommits.length; i++) {
			try {
				await prisma.stash.create({
					data: {
						userId: user.id,
						commitId: shuffledCommits[i].id,
						createdAt: faker.date.recent({ days: 15 }),
					},
				});
			} catch (error) {
				// Ignorar errores de duplicados (unique constraint)
				console.log(`Ya existe stash entre ${user.id} y ${shuffledCommits[i].id}`);
			}
		}
	}
}

/**
 * Crea forks (retweets) para los commits
 */
async function createForks(users: User[], commits: Commit[], tags: Tag[]) {
	for (const user of users) {
		// Cada usuario hace fork de 0-3 commits
		const numForks = faker.number.int({ min: 0, max: 3 });
		const shuffledCommits = faker.helpers.shuffle([...commits]);

		for (let i = 0; i < numForks && i < shuffledCommits.length; i++) {
			// No hacer fork de sus propios commits
			if (shuffledCommits[i].authorId === user.id) continue;

			try {
				// Decidir si añadir contenido adicional
				const addContent = faker.datatype.boolean(0.6); // 60% con contenido adicional

				const fork = await prisma.fork.create({
					data: {
						userId: user.id,
						commitId: shuffledCommits[i].id,
						content: addContent ? faker.lorem.sentence() : null,
						createdAt: faker.date.recent({ days: 10 }),
					},
				});

				// si no hay contenido no se a;aden tags
				if (addContent) {
					// Añadir 0-2 tags al fork
					const numTags = faker.number.int({ min: 0, max: 2 });
					const shuffledTags = faker.helpers.shuffle([...tags]);

					for (let j = 0; j < numTags; j++) {
						await prisma.forkTag.create({
							data: {
								forkId: fork.id,
								tagId: shuffledTags[j].id,
							},
						});
					}
				}
			} catch (error) {
				// Ignorar errores de duplicados (unique constraint)
				console.log(`Ya existe fork entre ${user.id} y ${shuffledCommits[i].id}`);
			}
		}
	}
}

/**
 * Crea notificaciones para los usuarios
 */
async function createNotifications(users: User[], commits: Commit[]) {
	const notificationTypes = ["NEW_FOLLOWER", "COMMIT_STAR", "COMMIT_PATCH", "COMMIT_FORK"];

	for (const user of users) {
		// Cada usuario tiene 3-10 notificaciones
		const numNotifications = faker.number.int({ min: 3, max: 10 });

		for (let i = 0; i < numNotifications; i++) {
			const type = faker.helpers.arrayElement(notificationTypes);
			const otherUser = faker.helpers.arrayElement(users.filter((u) => u.id !== user.id));
			let message = "";
			let link = null;

			switch (type) {
				case "NEW_FOLLOWER":
					message = `${otherUser.name} ha comenzado a seguirte`;
					link = `/profile/${otherUser.username}`;
					break;
				case "COMMIT_STAR": {
					const starredCommit = faker.helpers.arrayElement(commits.filter((c) => c.authorId === user.id));
					if (starredCommit) {
						message = `A ${otherUser.name} le ha gustado tu commit`;
						link = `/commits/${starredCommit.id}`;
					} else {
						message = `${otherUser.name} ha interactuado con tu contenido`;
					}
					break;
				}
				case "COMMIT_PATCH": {
					const commentedCommit = faker.helpers.arrayElement(commits.filter((c) => c.authorId === user.id));
					if (commentedCommit) {
						message = `${otherUser.name} ha comentado en tu commit`;
						link = `/commits/${commentedCommit.id}`;
					} else {
						message = `${otherUser.name} ha comentado en tu contenido`;
					}
					break;
				}
				case "COMMIT_FORK": {
					const forkedCommit = faker.helpers.arrayElement(commits.filter((c) => c.authorId === user.id));
					if (forkedCommit) {
						message = `${otherUser.name} ha hecho fork de tu commit`;
						link = `/commits/${forkedCommit.id}`;
					} else {
						message = `${otherUser.name} ha compartido tu contenido`;
					}
					break;
				}
			}

			await prisma.notification.create({
				data: {
					userId: user.id,
					type,
					message,
					link,
					read: faker.datatype.boolean(0.3), // 30% leídas
					createdAt: faker.date.recent({ days: 7 }),
				},
			});
		}
	}
}

main()
	.catch((e) => {
		console.error("❌ Error:", e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
