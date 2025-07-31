"use client";

import { Code2, Home, LogOut, Menu, Search, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AuthModals } from "@/components/auth-modals";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { signOut } from "@/lib/auth-client";
import type { Locale } from "@/lib/dictionaries";
import type { User as UserType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "./language-selector";
import { ModeToggle } from "./mode-toggle";
import { NotificationsModal } from "./notifications-modal";

/**
 * Props para el componente Navbar
 */
interface NavbarProps {
	initialUnreadCount: number;
	user: UserType | null;
	dict: any; // Diccionario de traducciones
	lang: Locale; // Idioma actual
}

/**
 * Componente Navbar con soporte para internacionalización
 * Maneja la navegación, autenticación y cambio de idiomas
 */
export function Navbar({ user, initialUnreadCount, dict, lang }: NavbarProps) {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const router = useRouter();

	// Configuración de navegación con traducciones
	const navigation = [
		{ name: dict.navigation.home, href: `/${lang}`, icon: Home },
		{ name: dict.navigation.commits, href: `/${lang}/commits`, icon: Search },
	];

	// Función para cambiar idioma

	const handleSignOut = async () => {
		await signOut();
		setMobileMenuOpen(false);
		router.refresh();
	};

	return (
		<nav className="sticky top-0 z-50 w-full border-border border-b bg-background/80 backdrop-blur-xl">
			<div className="gitfeel-gradient h-1"></div>
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<Link className="flex items-center gap-3" href="/">
						<div className="relative">
							<div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 opacity-75 blur"></div>
							<div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
								<Code2 className="h-5 w-5 text-white" />
							</div>
						</div>
						<div className="flex flex-col">
							<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text font-bold text-transparent text-xl">
								gitfeel
							</span>
							<span className="-mt-1 text-muted-foreground text-xs">for developers</span>
						</div>
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex md:items-center md:gap-8">
						<div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
							{navigation.map((item) => {
								const Icon = item.icon;
								const isActive = pathname === item.href;
								return (
									<Link
										className={cn(
											"flex items-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-all duration-200",
											isActive
												? "bg-primary text-primary-foreground shadow-sm"
												: "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
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
						{user ? (
							<div className="flex items-center gap-2">
								<LanguageSelector dict={dict} lang={lang} />
								<NotificationsModal initialUnreadCount={initialUnreadCount} /> {/* Notifications Modal */}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button className="relative h-8 w-8 rounded-full" variant="ghost">
											<Avatar className="h-8 w-8 ring-2 ring-primary/20">
												<AvatarImage src={user.image || ""} />
												<AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
													{user.name?.charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-56" forceMount>
										<div className="flex items-center justify-start gap-2 p-2">
											<div className="flex flex-col space-y-1 leading-none">
												<p className="font-medium">{user.name}</p>
												<p className="w-[200px] truncate text-muted-foreground text-sm">@{user.username}</p>
											</div>
										</div>
										<DropdownMenuSeparator />
										<DropdownMenuItem asChild>
											<Link className="flex items-center gap-2" href={`/${lang}/dev/${user.id}`}>
												<User className="h-4 w-4" />
												{dict.navigation.profile}
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<Link className="flex items-center gap-2" href={`/${lang}/profile`}>
												<Settings className="h-4 w-4" />
												{dict.navigation.settings}
											</Link>
										</DropdownMenuItem>

										<DropdownMenuSeparator />
										<DropdownMenuItem className="flex items-center gap-2 text-red-600 focus:text-red-600" onClick={handleSignOut}>
											<LogOut className="h-4 w-4" />
											{dict.auth.signOut}
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						) : (
							<AuthModals />
						)}
						<ModeToggle />
					</div>

					{/* Mobile Menu Button */}
					<div className="md:hidden">
						<Sheet onOpenChange={setMobileMenuOpen} open={mobileMenuOpen}>
							<SheetTrigger asChild>
								<Button size="icon" variant="ghost">
									<Menu className="h-5 w-5" />
									<span className="sr-only">Open menu</span>
								</Button>
							</SheetTrigger>
							<SheetContent className="w-80" side="right">
								<SheetHeader>
									<SheetTitle className="flex items-center gap-2">
										<div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-r from-blue-600 to-purple-600">
											<Code2 className="h-3 w-3 text-white" />
										</div>
										gitfeel
									</SheetTitle>
								</SheetHeader>

								<div className="mt-6 space-y-6">
									{/* User Info */}
									{user ? (
										<div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
											<Avatar className="h-10 w-10">
												<AvatarImage src={user.image || ""} />
												<AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
													{user.name?.charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="min-w-0 flex-1">
												<p className="truncate font-medium">{user.name}</p>
												<p className="truncate text-muted-foreground text-sm">@{user.username}</p>
											</div>
										</div>
									) : (
										<div className="space-y-3">
											<AuthModals />
										</div>
									)}

									{/* Notifications for mobile */}
									{user && (
										<div className="border-b pb-4">
											<NotificationsModal initialUnreadCount={initialUnreadCount} />
										</div>
									)}

									{/* Language Selector */}
									<div className="flex justify-center">
										<LanguageSelector dict={dict} lang={lang} />
									</div>

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
									{user && (
										<>
											<div className="space-y-2 border-t pt-6">
												<Link
													className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:bg-muted"
													href={`/${lang}/dev/${user.id}`}
													onClick={() => setMobileMenuOpen(false)}
												>
													<User className="h-4 w-4" />
													{dict.navigation.profile}
												</Link>
												<Link
													className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:bg-muted"
													href={`/${lang}/profile`}
													onClick={() => setMobileMenuOpen(false)}
												>
													<Settings className="h-4 w-4" />
													{dict.navigation.settings}
												</Link>
											</div>

											<div className="border-t pt-6">
												<Button
													className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-600"
													onClick={handleSignOut}
													variant="ghost"
												>
													<LogOut className="h-4 w-4" />
													{dict.auth.signOut}
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
