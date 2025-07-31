import { z } from "zod";

export const TagSchema = z.object({
	name: z.string().min(1, "Name is required"),
	color: z.string().min(1, "Color is required"),
});

export const ProfileSchema = z.object({
	name: z.string().min(1, "Name is required"),
	username: z.string().min(1, "Username is required"),
	bio: z.string().max(160, "Bio must be less than 160 characters").nullish(),
	location: z.string().max(100, "Location must be less than 100 characters").nullish(),
	website: z.string().url("Website must be a valid URL").nullish(),
	githubUrl: z.string().url("GitHub URL must be a valid URL").nullish(),
	twitterUrl: z.string().url("Twitter URL must be a valid URL").nullish(),
	tags: z.array(TagSchema).nullish(),
});

export type ProfileFormInput = z.infer<typeof ProfileSchema>;
export type TagInput = z.infer<typeof TagSchema>;
