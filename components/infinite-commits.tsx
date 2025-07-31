"use client";

import { Code, Loader2 } from "lucide-react";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { GitfeelCommit } from "@/components/gitfeel-commit";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadMoreCommits } from "@/lib/actions/commits";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { CommitWithDetails, ForkWithDetails, User } from "@/lib/types";

interface InfiniteCommitsProps {
	initialCommits: CommitWithDetails[];
	initialForks: ForkWithDetails[];
	user: User<{
		include: {
			stars: {
				include: {
					commit: true;
				};
			};
			stashes: {
				include: {
					commit: true;
				};
			};
		};
	}> | null;
	dict: Dictionary;
	lang: Locale;
	searchParams: {
		tags?: string;
		query?: string;
		sortBy?: string;
	};
}

export function InfiniteCommits({ initialCommits, initialForks, user, dict, lang, searchParams }: InfiniteCommitsProps) {
	const [commits, setCommits] = useState(initialCommits);
	const [forks, setForks] = useState(initialForks);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [offset, setOffset] = useState(5);

	// Combine and sort commits and forks
	const allPosts = [
		...commits.map((commit) => ({ type: "commit", data: commit, createdAt: commit.createdAt })),
		...forks.map((fork) => ({ type: "fork", data: fork, createdAt: fork.createdAt })),
	].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	// Memorizar la función loadMore para evitar recreaciones innecesarias
	const loadMore = useCallback(async () => {
		if (loading || !hasMore) return;

		setLoading(true);
		try {
			// Preparar los parámetros para la acción del servidor
			const tags = searchParams.tags?.split(",").filter(Boolean) || [];

			// Llamar a la acción del servidor directamente
			const data = await loadMoreCommits({
				tags: tags.length > 0 ? tags : undefined,
				query: searchParams.query,
				sortBy: (searchParams.sortBy as "recent" | "popular" | "stars" | "forks") || "recent",
				offset,
				limit: 5,
			});

			if (!data.hasMore) {
				setHasMore(false);
			} else {
				setCommits((prev) => [...prev, ...data.commits]);
				setForks((prev) => [...prev, ...data.forks]);
				setOffset((prev) => prev + 5);
			}
		} catch (error) {
			console.error("Error loading more commits:", error);
			setHasMore(false);
			setLoading(false);
		} finally {
			setLoading(false);
		}
	}, [loading, hasMore, searchParams, offset]);

	// Referencia para el elemento observador
	const observerRef = useRef<HTMLDivElement>(null);

	// Configurar Intersection Observer para scroll infinito
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry.isIntersecting && hasMore && !loading) {
					loadMore();
				}
			},
			{
				// Activar cuando el elemento esté 200px antes de ser visible
				rootMargin: "200px",
				threshold: 0.1,
			},
		);

		if (observerRef.current) {
			observer.observe(observerRef.current);
		}

		return () => {
			if (observerRef.current) {
				observer.unobserve(observerRef.current);
			}
		};
	}, [loadMore, hasMore, loading]);

	if (allPosts.length === 0) {
		return (
			<Card className="commit-card relative mt-4 ml-8 border-border border-t pt-4">
				<CardContent className="p-12 text-center">
					<div className="code-block mb-4">
						<p className="text-slate-400">$ git log --grep="{searchParams.query || searchParams.tags}"</p>
						<p className="text-red-400">{dict.pages.home.noCommitsTitle}</p>
					</div>
					<p className="mb-4 text-muted-foreground">{dict.pages.home.noCommitsDescription}</p>
					<Button asChild className="gitfeel-button">
						<a href={`/${lang}/commits`}>{dict.pages.home.allCommits}</a>
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
						<GitfeelCommit commit={post.data as CommitWithDetails} dict={dict} lang={lang} user={user} />
					) : (
						<GitfeelCommit
							commit={(post.data as ForkWithDetails).commit}
							dict={dict}
							forkContent={post.data.content}
							forkDate={new Date(post.data.createdAt)}
							forkTags={post.data.tags.map(({ tag }) => ({
								name: tag.name,
								id: tag.id,
								color: tag.color,
							}))}
							forkUser={(post.data as ForkWithDetails).user}
							isFork={true}
							lang={lang}
							user={user} // Pass fork's tags
						/>
					)}
				</div>
			))}

			{/* Elemento observador para scroll infinito */}
			{hasMore && (
				<div className="flex flex-col items-center gap-4 py-8" ref={observerRef}>
					{loading ? (
						<div className="flex items-center gap-2 text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							{dict.components.infiniteCommits.loading}
						</div>
					) : (
						<Button
							aria-label={dict.components.infiniteCommits.loadMore}
							className="flex items-center gap-2"
							onClick={() => {
								startTransition(() => {
									loadMore();
								});
							}}
							variant="outline"
						>
							<Code className="h-4 w-4" />
							{dict.components.infiniteCommits.loadMore}
						</Button>
					)}
				</div>
			)}

			{!hasMore && allPosts.length > 0 && (
				<div className="py-8 text-center text-muted-foreground">
					<div className="code-block mb-4 inline-block">
						<p className="text-slate-400">$ git log --oneline | wc -l</p>
						<p className="text-green-400">{allPosts.length}</p>
					</div>
					<p>{dict.components.infiniteCommits.allCommitsLoaded}</p>
				</div>
			)}
		</div>
	);
}
