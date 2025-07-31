"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { updateProfile } from "@/lib/actions/users";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { Tag, User } from "@/lib/types";
import { cn, generateRandomColorTailwind } from "@/lib/utils";
import { type ProfileFormInput, ProfileSchema } from "@/schemas/profile";

type ProfileFormProps = {
	user: User;
	dict: Dictionary;
	lang: Locale;
	suggestedTags: Tag[];
};

export type TagInput = {
	name: string;
	color: string;
};

export const ProfileForm: React.FC<ProfileFormProps> = ({ user, dict, lang, suggestedTags }) => {
	const [selectedTags, setSelectedTags] = useState<TagInput[]>([]); // State for selected tags in fork modal
	const [tagCustom, setTagCustom] = useState<TagInput>({ name: "", color: "" });
	const { execute, pending } = useAction(
		updateProfile,
		{},
		{
			onError(state) {
				console.log(state.errorMessage);
			},
			showToasts: true,
		},
	);

	const form = useForm<ProfileFormInput>({
		resolver: zodResolver(ProfileSchema),
		defaultValues: {
			name: user.name || "",
			username: user.username || "",
			bio: user.bio || "",
			githubUrl: user.githubUrl,
			location: user.location,
			///tags:user.tags
			twitterUrl: user.twitterUrl,
			website: user.website,
		},
	});

	const addTag = (tag: TagInput) => {
		if (!selectedTags.includes(tag)) {
			setSelectedTags([...selectedTags, tag]);
			form.setValue("tags", selectedTags);
		}
	};

	const removeTag = (tag: TagInput) => {
		setSelectedTags(selectedTags.filter((t) => t !== tag));
		form.setValue("tags", selectedTags);
	};

	const addCustomTag = () => {
		if (tagCustom.name.trim() && !selectedTags.includes(tagCustom)) {
			addTag(tagCustom);
			setTagCustom({ name: "", color: "" });
		}
	};

	return (
		<Form {...form}>
			<form
				action={() => {
					execute({
						data: form.getValues(),
						lang,
					});
				}}
				className="space-y-6"
			>
				{/* Avatar Section */}
				<div className="flex items-center gap-6 rounded-lg bg-muted/30 p-4">
					<div className="relative">
						<div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-75 blur"></div>
						<Avatar className="relative h-20 w-20 ring-4 ring-primary/20">
							<AvatarImage src={user.image || ""} />
							<AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl">
								{user.name?.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</div>
					<div className="flex-1">
						<h3 className="mb-1 font-medium">{dict.pages.profile.profilePicture}</h3>
						<p className="text-muted-foreground text-sm">{dict.pages.profile.profilePictureSync}</p>
					</div>
				</div>

				{/* Basic Info */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FormField
						name="name"
						render={({ field }) => (
							<FormItem className="space-y-2">
								<FormLabel>{dict.pages.profile.displayName}</FormLabel>
								<FormControl>
									<Input className="border-border bg-muted/50" placeholder={dict.pages.profile.displayNamePlaceholder} {...field} />
								</FormControl>
							</FormItem>
						)}
					/>

					<FormField
						name="username"
						render={({ field }) => (
							<FormItem className="space-y-2">
								<FormLabel>{dict.pages.profile.username}</FormLabel>
								<FormControl>
									<Input className="border-border bg-muted/50" placeholder={dict.pages.profile.usernamePlaceholder} {...field} />
								</FormControl>
							</FormItem>
						)}
					/>
				</div>

				{/* Tags */}

				<div className="space-y-2">
					{/* Tag suggestions for fork */}
					<Label className="font-medium text-sm">{dict.pages.profile.tag.title}</Label>
					{suggestedTags.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{suggestedTags.map((tag) => (
								<Badge
									className={cn(
										"cursor-pointer transition-colors hover:bg-purple-800/50",
										selectedTags.includes(tag) && "bg-purple-600 text-white",
										tag.color ? tag.color : "bg-purple-900/50 text-purple-300 hover:bg-purple-800/50",
									)}
									key={tag.id}
									onClick={() => addTag(tag)}
									variant={selectedTags.includes(tag) ? "default" : "outline"}
								>
									#{tag.name}
								</Badge>
							))}
						</div>
					)}

					{/* Selected tags for fork */}
					{selectedTags.length > 0 && (
						<div className="space-y-2">
							<Label className="font-medium text-sm">{dict.pages.profile.tag.selected}</Label>
							<div className="flex flex-wrap gap-2">
								{selectedTags.map((tag) => (
									<Badge className={cn("flex items-center gap-4", tag.color)} key={tag.name}>
										#{tag.name}
										<Button className="h-5 w-5 cursor-pointer" onClick={() => removeTag(tag)} size="sm" variant="destructive">
											<X className="h-5 w-5 cursor-pointer" />
										</Button>
									</Badge>
								))}
							</div>
						</div>
					)}

					{/* Add Custom Tag for fork */}
					<div className="space-y-2">
						<Label className="font-medium text-sm">{dict.components.gitfeelCommit.forkTagPlaceholder}</Label>
						<div className="flex gap-2">
							<Input
								className="border-border bg-muted/50"
								onChange={(e) => setTagCustom({ name: e.target.value, color: generateRandomColorTailwind() })}
								placeholder={dict.components.gitfeelCommit.forkTagPlaceholder}
								value={tagCustom.name}
							/>
							<Button
								className="gitfeel-button"
								disabled={!tagCustom.name.trim() || selectedTags.includes(tagCustom)}
								onClick={addCustomTag}
								size="sm"
								type="button"
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>

				{/* Bio */}
				<FormField
					name="bio"
					render={({ field }) => (
						<FormItem className="space-y-2">
							<FormLabel>{dict.pages.profile.bioReadme}</FormLabel>
							<FormControl>
								<div className="code-block">
									<div className="mb-2 flex items-center gap-2 text-cyan-400">
										<span className="text-green-400">$</span>
										<span className="text-sm">vim README.md</span>
									</div>
									<Textarea
										className="min-h-[100px] resize-none border-blue-500/30 border-l-2 border-none bg-transparent pl-4 font-mono text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
										maxLength={160}
										placeholder={dict.pages.profile.bioPlaceholder}
										{...field}
									/>
								</div>
							</FormControl>
							<FormDescription className="text-muted-foreground text-xs">{dict.pages.profile.bioMaxLength}</FormDescription>
						</FormItem>
					)}
				/>

				{/* Location & Website */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FormField
						name="location"
						render={({ field }) => (
							<FormItem className="space-y-2">
								<FormLabel>{dict.pages.profile.location}</FormLabel>
								<FormControl>
									<Input className="border-border bg-muted/50" placeholder={dict.pages.profile.locationPlaceholder} {...field} />
								</FormControl>
							</FormItem>
						)}
					/>

					<FormField
						name="website"
						render={({ field }) => (
							<FormItem className="space-y-2">
								<FormLabel>{dict.pages.profile.website}</FormLabel>
								<FormControl>
									<Input
										className="border-border bg-muted/50"
										placeholder={dict.pages.profile.websitePlaceholder}
										type="url"
										{...field}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
				</div>

				{/* Social Links */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FormField
						name="githubUrl"
						render={({ field }) => (
							<FormItem className="space-y-2">
								<FormLabel>{dict.pages.profile.github}</FormLabel>
								<FormControl>
									<Input
										className="border-border bg-muted/50"
										placeholder={dict.pages.profile.githubPlaceholder}
										type="url"
										{...field}
									/>
								</FormControl>
							</FormItem>
						)}
					/>

					<FormField
						name="twitterUrl"
						render={({ field }) => (
							<FormItem className="space-y-2">
								<FormLabel>{dict.pages.profile.twitter}</FormLabel>
								<FormControl>
									<Input
										className="border-border bg-muted/50"
										placeholder={dict.pages.profile.twitterPlaceholder}
										type="url"
										{...field}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
				</div>

				{/* Actions */}
				<div className="flex justify-end gap-3 border-border border-t pt-4">
					<Button asChild disabled={pending} variant="outline">
						<Link href={`/${lang}/dev/${user.id}`}>{dict.pages.profile.cancel}</Link>
					</Button>
					<Button className="gitfeel-button flex items-center gap-2" disabled={pending} type="submit">
						<Save className="h-4 w-4" />
						{dict.pages.profile.saveChanges}
					</Button>
				</div>
			</form>
		</Form>
	);
};
