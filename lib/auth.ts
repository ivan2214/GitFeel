import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		autoSignIn: true,
	},
	socialProviders: {
		discord: {
			clientId: process.env.DISCORD_CLIENT_ID!,
			clientSecret: process.env.DISCORD_CLIENT_SECRET!,
		},
		github: {
			clientId: process.env.GITHUB_CLIENT_ID!,
			clientSecret: process.env.GITHUB_CLIENT_SECRET!,
		},
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		},
	},
	plugins: [nextCookies()],
	user: {
		additionalFields: {
			username: {
				type: "string",
				required: true,
			},
			bio: {
				type: "string",
				required: false,
			},
			location: {
				type: "string",
				required: false,
			},
			website: {
				type: "string",
				required: false,
			},
			githubUrl: {
				type: "string",
				required: false,
			},
			twitterUrl: {
				type: "string",
				required: false,
			},
		},
	},
});
