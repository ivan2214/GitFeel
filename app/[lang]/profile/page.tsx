import { ArrowLeft, Code, Info } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/data/user";
import { getDictionary, type Locale } from "@/lib/dictionaries";
import prisma from "@/lib/prisma";
import { ProfileForm } from "./components/profile-form";

// Forzar renderizado dinámico para permitir el uso de headers()
export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ lang: Locale }> }) {
	const { lang } = await params;
	const dict = await getDictionary(lang);
	const user = await getCurrentUser();

	if (!user) {
		notFound();
	}

	const allUniqueTags = await prisma.tag.findMany({
		distinct: ["name"],
	});

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<div className="space-y-6">
					{/* Navigation */}
					<div className="flex items-center gap-4">
						<Button asChild size="sm" variant="ghost">
							<Link className="flex items-center gap-2" href={`/${lang}/dev/${user.id}`}>
								<ArrowLeft className="h-4 w-4" />
								{dict.pages.profile.backToProfile}
							</Link>
						</Button>
					</div>

					{/* Profile Settings */}
					<Card className="commit-card relative border-border border-t p-4">
						<div className="commit-header flex flex-col items-start">
							<section className="flex items-center gap-3">
								<Code className="h-3 w-3" />
								<span>{dict.pages.profile.profileConfiguration}</span>
							</section>
							<span className="ml-auto">@{user.username}</span>
						</div>
						<CardContent className="commit-content">
							<ProfileForm dict={dict} lang={lang} suggestedTags={allUniqueTags} user={user} />
						</CardContent>
					</Card>

					{/* Tips */}
					<Card className="commit-card relative border-border border-t p-4">
						<div className="commit-header flex items-center gap-3">
							<Info className="h-3 w-3" />
							<span>{dict.pages.profile.profileTips}</span>
						</div>
						<CardContent className="commit-content">
							<div className="code-block">
								<div className="space-y-2 text-sm">
									<p className="text-cyan-400"># {dict.pages.profile.proTips}</p>
									<p className="text-slate-300">• {dict.pages.profile.tipBio}</p>
									<p className="text-slate-300">• {dict.pages.profile.tipGithub}</p>
									<p className="text-slate-300">• {dict.pages.profile.tipLocation}</p>
									<p className="text-slate-300">• {dict.pages.profile.tipWebsite}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
