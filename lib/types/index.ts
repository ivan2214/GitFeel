import type { Prisma } from "@/app/generated/prisma";

export interface ActionResult {
	errorMessage?: string;
	successMessage?: string;
}

export interface CreateCommitState extends ActionResult {
	commitId?: string;
}

export interface CreatePatchState extends ActionResult {}

export interface UpdateProfileState extends ActionResult {}

export interface ToggleStarState extends ActionResult {}

export interface ToggleStashState extends ActionResult {}

export interface CreateForkState extends ActionResult {}

export interface ToggleFollowState extends ActionResult {}

// Prisma Types
type UserArgs = {
	select?: Prisma.UserSelect;
	include?: Prisma.UserInclude;
};

export type User<T extends UserArgs = {}> = Prisma.UserGetPayload<T>;

type CommitArgs = {
	select?: Prisma.CommitSelect;
	include?: Prisma.CommitInclude;
};

export type Commit<T extends CommitArgs = {}> = Prisma.CommitGetPayload<T>;

type PatchArgs = {
	select?: Prisma.PatchSelect;
	include?: Prisma.PatchInclude;
};

export type Patch<T extends PatchArgs = {}> = Prisma.PatchGetPayload<T>;

type TagArgs = {
	select?: Prisma.TagSelect;
	include?: Prisma.TagInclude;
};

export type Tag<T extends TagArgs = {}> = Prisma.TagGetPayload<T>;

/* fork */
type ForkArgs = {
	select?: Prisma.ForkSelect;
	include?: Prisma.ForkInclude;
};

export type Fork<T extends ForkArgs = {}> = Prisma.ForkGetPayload<T>;

type NotificationArgs = {
	select?: Prisma.NotificationSelect;
	include?: Prisma.NotificationInclude;
};

export type Notification<T extends NotificationArgs = {}> = Prisma.NotificationGetPayload<T>;

// Extended types for UI
export type CommitWithDetails = Commit<{
	include: {
		author: true;
		tags: {
			include: {
				tag: true;
			};
		};
		_count: {
			select: {
				patches: true;
				stars: true;
				stashes: true;
				forks: true;
			};
		};
	};
}>;

export type UserWithStats = User<{
	include: {
		_count: {
			select: {
				commits: true;
				followers: true;
				following: true;
			};
		};
	};
}>;

export type ForkWithDetails = Fork<{
	include: {
		user: true;
		commit: {
			include: {
				author: true;
				tags: {
					include: {
						tag: true;
					};
				};
				_count: {
					select: {
						patches: true;
						stars: true;
						stashes: true;
						forks: true;
					};
				};
			};
		};
	};
}>;
