"use client";

import { Filter, Plus, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";

interface AdvancedSearchProps {
	allTags: Tag<{
		include: {
			_count: {
				select: {
					commits: true;
				};
			};
		};
	}>[];
	lang: Locale;
	dic: Dictionary;
}

export function AdvancedSearch({ allTags, dic, lang }: AdvancedSearchProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [query, setQuery] = useState(searchParams.get("query") || "");
	const [selectedTags, setSelectedTags] = useState<string[]>(searchParams.get("tags")?.split(",").filter(Boolean) || []);
	const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "recent");
	const [tagInput, setTagInput] = useState("");

	const handleSearch = () => {
		const params = new URLSearchParams();

		if (query.trim()) params.set("query", query.trim());
		if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
		if (sortBy !== "recent") params.set("sortBy", sortBy);

		router.push(`/${lang}/commits?${params.toString()}`);
	};

	const addTag = (tagName: string) => {
		if (!selectedTags.includes(tagName) && selectedTags.length < 10) {
			setSelectedTags([...selectedTags, tagName]);
		}
	};

	const removeTag = (tagName: string) => {
		setSelectedTags(selectedTags.filter((tag) => tag !== tagName));
	};

	const addCustomTag = () => {
		if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
			addTag(tagInput.trim().toLowerCase());
			setTagInput("");
		}
	};

	const clearAll = () => {
		setQuery("");
		setSelectedTags([]);
		setSortBy("recent");
		router.push(`/${lang}/commits`);
	};

	useEffect(() => {
		const params = new URLSearchParams();
		if (query.trim()) params.set("query", query.trim());
		if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
		if (sortBy !== "recent") params.set("sortBy", sortBy);

		const newUrl = `/${lang}/commits${params.toString() ? `?${params.toString()}` : ""}`;
		router.replace(newUrl);
	}, [query, selectedTags, sortBy, router, lang]);

	return (
		<Card className="commit-card p-0">
			<CardHeader className="commit-header p-0">
				<Filter className="h-3 w-3" />
				<span>{dic.pages.commits.advancedSearch}</span>
				{(query || selectedTags.length > 0 || sortBy !== "recent") && (
					<Button className="ml-auto text-xs hover:text-red-400" onClick={clearAll} size="sm" variant="ghost">
						{dic.pages.commits.clearAll}
					</Button>
				)}
			</CardHeader>
			<CardContent className="space-y-4 p-4">
				{/* Search Input */}
				<div className="space-y-2">
					<Label className="font-medium text-sm">{dic.pages.commits.searchCommits}</Label>
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
						<Input
							className="border-border bg-muted/50 pl-10"
							onChange={(e) => setQuery(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							placeholder={dic.pages.commits.searchPlaceholder}
							value={query}
						/>
					</div>
				</div>

				{/* Sort Options */}
				<div className="space-y-2">
					<Label className="font-medium text-sm">{dic.pages.commits.order.label}</Label>
					<Select onValueChange={setSortBy} value={sortBy}>
						<SelectTrigger className="border-border bg-muted/50">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="recent">{dic.pages.commits.order.options.recent}</SelectItem>
							<SelectItem value="popular">{dic.pages.commits.order.options.popular}</SelectItem>
							<SelectItem value="stars">{dic.pages.commits.order.options.stars}</SelectItem>
							<SelectItem value="forks">{dic.pages.commits.order.options.forks}</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Selected Tags */}
				{selectedTags.length > 0 && (
					<div className="space-y-2">
						<Label className="font-medium text-sm">{dic.pages.commits.customTagSearch}</Label>
						<div className="flex flex-wrap gap-2">
							{selectedTags.map((tag) => (
								<Badge className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white" key={tag}>
									#{tag}
									<X className="h-3 w-3 cursor-pointer hover:text-red-300" onClick={() => removeTag(tag)} />
								</Badge>
							))}
						</div>
					</div>
				)}

				{/* Add Custom Tag */}
				<div className="space-y-2">
					<Label className="font-medium text-sm">{dic.pages.commits.customTagSearch}</Label>
					<div className="flex gap-2">
						<Input
							className="border-border bg-muted/50"
							onChange={(e) => setTagInput(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
							placeholder={dic.pages.commits.customTagSearchPlaceholder}
							value={tagInput}
						/>
						<Button
							className="gitfeel-button"
							disabled={!tagInput.trim() || selectedTags.includes(tagInput.trim())}
							onClick={addCustomTag}
							size="sm"
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Popular Tags */}
				<div className="space-y-2">
					<Label className="font-medium text-sm">{dic.pages.commits.popularTags}</Label>
					<div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
						{allTags.slice(0, 20).map((tag) => (
							<Badge
								className={cn(
									"cursor-pointer transition-colors",
									selectedTags.includes(tag.name)
										? "border-transparent bg-gradient-to-r from-blue-600 to-purple-600 text-white"
										: "border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 hover:border-blue-500/50",
									tag.color,
								)}
								key={tag.id}
								onClick={() => (selectedTags.includes(tag.name) ? removeTag(tag.name) : addTag(tag.name))}
								variant={selectedTags.includes(tag.name) ? "default" : "outline"}
							>
								#{tag.name} ({tag._count.commits})
							</Badge>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
