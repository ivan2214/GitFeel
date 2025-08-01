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
			clientId: process.env.DISCORD_CLIENT_ID as string,
			clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
			mapProfileToUser: (profile) => {
				console.log("Discord profile:");
				console.dir(profile, {
					depth: null,
				});

				return {
					username: profile.username,
				};
			},
		},
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
			mapProfileToUser: (profile) => {
				console.log("GitHub profile:");
				console.dir(profile, {
					depth: null,
				});

				return {
					username: profile.login,
				};
			},
		},
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			mapProfileToUser: (profile) => {
				console.log("Google profile:");
				console.dir(profile, {
					depth: null,
				});

				return {
					username: profile.name,
				};
			},
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
