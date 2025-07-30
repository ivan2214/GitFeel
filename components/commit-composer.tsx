"use client";

import { debounce } from "lodash";
import { GitCommit, ImageIcon, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { type UploadedFile, Uploader } from "@/components/uploader";
import { useAction } from "@/hooks/use-action";
import { createCommit, suggestTags } from "@/lib/actions/commits";
import { useSession } from "@/lib/auth-client";

export function CommitComposer() {
	const { data: session } = useSession();
	const [content, setContent] = useState("");
	const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
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
					const tags = await suggestTags(text);
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
		execute(formData);
	};

	const addTag = (tag: string) => {
		if (!selectedTags.includes(tag) && selectedTags.length < 5) {
			setSelectedTags([...selectedTags, tag]);
		}
	};

	const removeTag = (tag: string) => {
		setSelectedTags(selectedTags.filter((t) => t !== tag));
	};

	if (!session?.user) {
		return (
			<Card>
				<CardContent className="p-6 text-center">
					<p className="text-muted-foreground">
						Inicia sesión para hacer commits
					</p>
				</CardContent>
			</Card>
		);
	}

	const remainingChars = 280 - content.length;

	return (
		<Card>
			<CardContent className="p-6">
				<form action={handleSubmit} className="space-y-4">
					<div className="flex gap-3">
						<Avatar className="h-10 w-10">
							<AvatarImage src={session.user.image || ""} />
							<AvatarFallback>
								{session.user.name?.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 space-y-3">
							<Textarea
								placeholder="¿Qué está pasando en tu código? Comparte tu frustración, logro o duda..."
								value={content}
								onChange={(e) => setContent(e.target.value)}
								className="min-h-[100px] resize-none border-none p-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
								maxLength={280}
							/>

							{showImageUpload && (
								<div className="border rounded-lg p-4">
									<Uploader
										variant="minimal"
										maxFiles={1}
										accept={["image/*"]}
										onChange={(file) => setUploadedImage(file as UploadedFile)}
										value={uploadedImage}
										placeholder="Sube una imagen para tu commit"
									/>
								</div>
							)}

							{/* Tag suggestions */}
							{(suggestedTags.length > 0 || isLoadingTags) && (
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<Sparkles className="h-4 w-4 text-blue-500" />
										<span className="text-sm font-medium">Tags sugeridos:</span>
										{isLoadingTags && (
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
										)}
									</div>
									<div className="flex flex-wrap gap-2">
										{suggestedTags.map((tag) => (
											<Badge
												key={tag}
												variant={
													selectedTags.includes(tag) ? "default" : "outline"
												}
												className="cursor-pointer hover:bg-primary/10"
												onClick={() => addTag(tag)}
											>
												#{tag}
											</Badge>
										))}
									</div>
								</div>
							)}

							{/* Selected tags */}
							{selectedTags.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{selectedTags.map((tag) => (
										<Badge key={tag} className="flex items-center gap-1">
											#{tag}
											<X
												className="h-3 w-3 cursor-pointer"
												onClick={() => removeTag(tag)}
											/>
										</Badge>
									))}
								</div>
							)}
						</div>
					</div>

					<div className="flex items-center justify-between pt-3 border-t">
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setShowImageUpload(!showImageUpload)}
							>
								<ImageIcon className="h-4 w-4" />
							</Button>
						</div>

						<div className="flex items-center gap-3">
							<span
								className={`text-sm ${remainingChars < 20 ? "text-red-500" : "text-muted-foreground"}`}
							>
								{remainingChars}
							</span>
							<Button
								type="submit"
								disabled={pending || !content.trim() || remainingChars < 0}
								className="flex items-center gap-2"
							>
								<GitCommit className="h-4 w-4" />
								{pending ? "Committing..." : "Commit"}
							</Button>
						</div>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
