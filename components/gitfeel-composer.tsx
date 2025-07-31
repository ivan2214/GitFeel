"use client";

import { debounce } from "lodash";
import { Code, GitCommit, ImageIcon, Sparkles, X } from "lucide-react";
import { startTransition, useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type UploadedFile, Uploader } from "@/components/uploader";
import { useAction } from "@/hooks/use-action";
import { createCommit, suggestTags } from "@/lib/actions/commits";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { TagInput } from "@/schemas/profile";

export function GitfeelComposer({ user, dict, lang }: { lang: Locale; user: User | null; dict: Dictionary }) {
	const [content, setContent] = useState("");
	const [suggestedTags, setSuggestedTags] = useState<TagInput[]>([]);
	const [selectedTags, setSelectedTags] = useState<TagInput[]>([]);
	const [showImageUpload, setShowImageUpload] = useState(false);
	const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null);
	const [isLoadingTags, setIsLoadingTags] = useState(false);

	const { execute, pending } = useAction(
		createCommit,
		{},
		{
			onSuccess: () => {
				setContent("");
				setSelectedTags([]);
				setSuggestedTags([]);
				setUploadedImage(null);
				setShowImageUpload(false);
			},
		},
	);

	const debouncedSuggestTags = useCallback(
		debounce(async (text: string) => {
			if (text.length > 10) {
				setIsLoadingTags(true);
				try {
					const { tags } = await suggestTags(text, lang);
					console.log("tags", tags);

					setSuggestedTags(tags);
				} catch (error) {
					console.error("Error getting tag suggestions:", error);
				} finally {
					setIsLoadingTags(false);
				}
			} else {
				setSuggestedTags([]);
			}
		}, 1000),
		[],
	);

	useEffect(() => {
		debouncedSuggestTags(content);
	}, [content, debouncedSuggestTags]);

	const handleSubmit = (formData: FormData) => {
		formData.set("content", content);
		formData.set("tags", selectedTags.join(","));
		if (uploadedImage) {
			formData.set("imageUrl", uploadedImage.url);
		}
		startTransition(() => {
			execute(formData);
		});
	};

	const addTag = (tag: TagInput) => {
		if (!selectedTags.includes(tag) && selectedTags.length < 5) {
			setSelectedTags([...selectedTags, tag]);
		}
	};

	const removeTag = (tag: TagInput) => {
		setSelectedTags(selectedTags.filter((t) => t !== tag));
	};

	if (!user) {
		return (
			<div className="commit-card rounded-xl border border-border bg-card/50 p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
				<div className="commit-header mb-4 flex items-center gap-2 border-border/50 border-b pb-2">
					<Code className="h-3 w-3" />
					<span>{dict.components.gitfeelComposer.authRequired}</span>
				</div>
				<div className="commit-content py-8 text-center">
					<p className="text-muted-foreground">{dict.components.gitfeelComposer.authRequiredDescription}</p>
				</div>
			</div>
		);
	}

	const remainingChars = 280 - content.length;

	return (
		<div className="commit-card flex flex-col gap-2 rounded-xl border border-border bg-card/50 p-1.5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
			{/* Header */}
			<div className="commit-header flex items-center gap-2 border-border/50 border-b p-2">
				<Code className="h-3 w-3" />
				<span>{dict.components.gitfeelComposer.newCommit}</span>
				<span className="ml-auto text-primary">@{user.username}</span>
			</div>

			{/* Content */}
			<div className="commit-content">
				<form
					className="space-y-4"
					onSubmit={(e) => {
						e.preventDefault();
						handleSubmit(new FormData(e.target as HTMLFormElement));
					}}
				>
					<div className="flex gap-4">
						<Avatar className="h-10 w-10 ring-2 ring-primary/20">
							<AvatarImage src={user.image || ""} />
							<AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
								{user.name?.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 space-y-3">
							<div className="code-block">
								<div className="mb-3 flex items-center gap-2 text-cyan-400">
									<span className="text-green-400">$</span>
									<span className="text-sm">git commit -m</span>
								</div>
								<Textarea
									className="min-h-[100px] resize-none border-blue-500/30 border-l-2 border-none bg-transparent pl-4 font-mono text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
									maxLength={280}
									onChange={(e) => setContent(e.target.value)}
									placeholder={dict.components.gitfeelComposer.placeholder}
									value={content}
								/>
							</div>

							{showImageUpload && (
								<div className="rounded-lg border border-border bg-muted/30 p-4">
									<Uploader
										accept={["image/*"]}
										maxFiles={1}
										onChange={(file) => setUploadedImage(file as UploadedFile)}
										placeholder={dict.components.gitfeelComposer.uploadPlaceholder}
										value={uploadedImage}
										variant="minimal"
									/>
								</div>
							)}

							{/* Tag suggestions */}
							{(suggestedTags.length > 0 || isLoadingTags) && (
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<Sparkles className="h-4 w-4 text-purple-400" />
										<span className="font-medium text-purple-400 text-sm">{dict.components.gitfeelComposer.suggestedTags}</span>
										{isLoadingTags && (
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
										)}
									</div>
									<div className="flex flex-wrap gap-2">
										{suggestedTags.map((tag) => (
											<Badge
												className={cn(
													"cursor-pointer transition-colors",
													selectedTags.includes(tag)
														? "border-transparent bg-gradient-to-r from-blue-600 to-purple-600 text-white"
														: "border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 hover:border-blue-500/50",
													tag.color,
												)}
												key={tag.name}
												onClick={() => addTag(tag)}
												variant={selectedTags.includes(tag) ? "default" : "outline"}
											>
												#{tag.name}
											</Badge>
										))}
									</div>
								</div>
							)}

							{/* Selected tags */}
							{selectedTags.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{selectedTags.map((tag) => (
										<Badge
											className={cn(
												"flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white",
												tag.color,
											)}
											key={tag.name}
										>
											#{tag.name}
											<X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
										</Badge>
									))}
								</div>
							)}
						</div>
					</div>

					<div className="flex items-center justify-between border-border border-t pt-3">
						<div className="flex items-center gap-2">
							<Button
								className="text-muted-foreground hover:text-foreground"
								onClick={() => setShowImageUpload(!showImageUpload)}
								size="sm"
								type="button"
								variant="ghost"
							>
								<ImageIcon className="h-4 w-4" />
							</Button>
						</div>

						<div className="flex items-center gap-3">
							<span className={`text-sm ${remainingChars < 20 ? "text-red-400" : "text-muted-foreground"}`}>{remainingChars}</span>
							<Button
								className="gitfeel-button flex items-center gap-2"
								disabled={pending || !content.trim() || remainingChars < 0}
								type="submit"
							>
								<GitCommit className="h-4 w-4" />
								{pending ? dict.components.gitfeelComposer.committing : dict.components.gitfeelComposer.commit}
							</Button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
