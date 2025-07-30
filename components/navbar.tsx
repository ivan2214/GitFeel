"use client";

import { GitCommit, Home, LogOut, Menu, Search, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { signOut } from "@/lib/auth-client";
import type { User as UserType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AuthModals } from "./auth-modals";

const navigation = [
	{ name: "Inicio", href: "/", icon: Home },
	{ name: "Explorar", href: "/commits", icon: Search },
];

export function Navbar({ currentUser }: { currentUser: UserType | null }) {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const handleSignOut = async () => {
		await signOut();
	};

	return (
		<nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<Link className="flex items-center gap-2" href="/">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
							<GitCommit className="h-4 w-4 text-white" />
						</div>
						<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-bold text-transparent text-xl">gitfeel</span>
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex md:items-center md:gap-8">
						<div className="flex items-center gap-6">
							{navigation.map((item) => {
								const Icon = item.icon;
								return (
									<Link
										className={cn(
											"flex items-center gap-2 font-medium text-sm transition-colors hover:text-primary",
											pathname === item.href ? "text-primary" : "text-muted-foreground",
										)}
										href={item.href}
										key={item.name}
									>
										<Icon className="h-4 w-4" />
										{item.name}
									</Link>
								);
							})}
						</div>

						{/* User Menu or Auth Buttons */}
						{currentUser ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button className="relative h-8 w-8 rounded-full" variant="ghost">
										<Avatar className="h-8 w-8">
											<AvatarImage src={currentUser.image || ""} />
											<AvatarFallback>{currentUser.name?.charAt(0).toUpperCase()}</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-56" forceMount>
									<div className="flex items-center justify-start gap-2 p-2">
										<div className="flex flex-col space-y-1 leading-none">
											<p className="font-medium">{currentUser.name}</p>
											<p className="w-[200px] truncate text-muted-foreground text-sm">@{currentUser.username}</p>
										</div>
									</div>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link className="flex items-center gap-2" href={`/dev/${currentUser.id}`}>
											<User className="h-4 w-4" />
											Mi Repository
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link className="flex items-center gap-2" href="/profile">
											<Settings className="h-4 w-4" />
											Configuración
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem className="flex items-center gap-2 text-red-600 focus:text-red-600" onClick={handleSignOut}>
										<LogOut className="h-4 w-4" />
										Cerrar Sesión
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<AuthModals />
						)}
					</div>

					{/* Mobile Menu Button */}
					<div className="md:hidden">
						<Sheet onOpenChange={setMobileMenuOpen} open={mobileMenuOpen}>
							<SheetTrigger asChild>
								<Button size="icon" variant="ghost">
									<Menu className="h-5 w-5" />
									<span className="sr-only">Abrir menú</span>
								</Button>
							</SheetTrigger>
							<SheetContent className="w-80" side="right">
								<SheetHeader>
									<SheetTitle className="flex items-center gap-2">
										<div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-r from-blue-600 to-purple-600">
											<GitCommit className="h-3 w-3 text-white" />
										</div>
										gitfeel
									</SheetTitle>
								</SheetHeader>

								<div className="mt-6 space-y-6">
									{/* User Info */}
									{currentUser ? (
										<div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
											<Avatar className="h-10 w-10">
												<AvatarImage src={currentUser.image || ""} />
												<AvatarFallback>{currentUser.name?.charAt(0).toUpperCase()}</AvatarFallback>
											</Avatar>
											<div className="min-w-0 flex-1">
												<p className="truncate font-medium">{currentUser.name}</p>
												<p className="truncate text-muted-foreground text-sm">@{currentUser.username}</p>
											</div>
										</div>
									) : (
										<div className="space-y-3">
											<AuthModals />
										</div>
									)}

									{/* Navigation Links */}
									<div className="space-y-2">
										{navigation.map((item) => {
											const Icon = item.icon;
											return (
												<Link
													className={cn(
														"flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-colors hover:bg-muted",
														pathname === item.href ? "bg-muted text-primary" : "text-muted-foreground",
													)}
													href={item.href}
													key={item.name}
													onClick={() => setMobileMenuOpen(false)}
												>
													<Icon className="h-4 w-4" />
													{item.name}
												</Link>
											);
										})}
									</div>

									{/* User Actions */}
									{currentUser && (
										<>
											<div className="space-y-2 border-t pt-6">
												<Link
													className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:bg-muted"
													href={`/dev/${currentUser.id}`}
													onClick={() => setMobileMenuOpen(false)}
												>
													<User className="h-4 w-4" />
													Mi Repository
												</Link>
												<Link
													className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:bg-muted"
													href="/profile"
													onClick={() => setMobileMenuOpen(false)}
												>
													<Settings className="h-4 w-4" />
													Configuración
												</Link>
											</div>

											<div className="border-t pt-6">
												<Button
													className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-600"
													onClick={handleSignOut}
													variant="ghost"
												>
													<LogOut className="h-4 w-4" />
													Cerrar Sesión
												</Button>
											</div>
										</>
									)}
								</div>
							</SheetContent>
						</Sheet>
					</div>
				</div>
			</div>
		</nav>
	);
}
