"use client";

import { Code, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { GitfeelCommit } from "@/components/gitfeel-commit";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CommitWithDetails, User } from "@/lib/types";

interface InfiniteCommitsProps {
	initialCommits: CommitWithDetails[];
	initialForks: any[];
	user: User | null;
	searchParams: {
		tags?: string;
		query?: string;
		sortBy?: string;
	};
}

export function InfiniteCommits({ initialCommits, initialForks, user, searchParams }: InfiniteCommitsProps) {
	const [commits, setCommits] = useState(initialCommits);
	const [forks, setForks] = useState(initialForks);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [offset, setOffset] = useState(20);

	// Combine and sort commits and forks
	const allPosts = [
		...commits.map((commit) => ({ type: "commit", data: commit, createdAt: commit.createdAt })),
		...forks.map((fork) => ({ type: "fork", data: fork, createdAt: fork.createdAt })),
	].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	const loadMore = async () => {
		if (loading || !hasMore) return;

		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (searchParams.tags) params.set("tags", searchParams.tags);
			if (searchParams.query) params.set("query", searchParams.query);
			if (searchParams.sortBy) params.set("sortBy", searchParams.sortBy);
			params.set("offset", offset.toString());

			const response = await fetch(`/api/commits?${params.toString()}`);
			const data = await response.json();

			if (data.commits.length === 0 && data.forks.length === 0) {
				setHasMore(false);
			} else {
				setCommits((prev) => [...prev, ...data.commits]);
				setForks((prev) => [...prev, ...data.forks]);
				setOffset((prev) => prev + 20);
			}
		} catch (error) {
			console.error("Error loading more commits:", error);
		} finally {
			setLoading(false);
		}
	};

	// Auto-load when scrolling near bottom
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const handleScroll = () => {
			if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
				loadMore();
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [loading, hasMore, offset]);

	if (allPosts.length === 0) {
		return (
			<Card className="commit-card">
				<CardContent className="p-12 text-center">
					<div className="code-block mb-4">
						<p className="text-slate-400">$ git log --grep="{searchParams.query || searchParams.tags}"</p>
						<p className="text-red-400">fatal: no commits found</p>
					</div>
					<p className="mb-4 text-muted-foreground">No se encontraron commits con estos criterios.</p>
					<Button asChild className="gitfeel-button">
						<a href="/commits">Ver todos los commits</a>
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{allPosts.map((post, index) => (
				<div key={`${post.type}-${post.data.id}-${index}`}>
					{post.type === "commit" ? (
						<GitfeelCommit commit={post.data} user={user} />
					) : (
						<GitfeelCommit
							commit={post.data.commit}
							forkContent={post.data.content}
							forkDate={new Date(post.data.createdAt)}
							forkUser={post.data.user}
							isFork={true}
							user={user}
						/>
					)}
				</div>
			))}

			{/* Load More Button */}
			{hasMore && (
				<div className="flex justify-center py-8">
					<Button className="flex items-center gap-2 bg-transparent" disabled={loading} onClick={loadMore} variant="outline">
						{loading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Cargando más commits...
							</>
						) : (
							<>
								<Code className="h-4 w-4" />
								Cargar más commits
							</>
						)}
					</Button>
				</div>
			)}

			{!hasMore && allPosts.length > 0 && (
				<div className="py-8 text-center text-muted-foreground">
					<div className="code-block mb-4 inline-block">
						<p className="text-slate-400">$ git log --oneline | wc -l</p>
						<p className="text-green-400">{allPosts.length}</p>
					</div>
					<p>Has visto todos los commits disponibles</p>
				</div>
			)}
		</div>
	);
}
