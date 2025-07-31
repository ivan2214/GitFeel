"use client";

import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { User as UserType } from "@/lib/types";
import { NotificationsModal } from "./notifications-modal";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

type MenuUserProps = {
	dict: Dictionary;
	user: UserType;
	initialUnreadCount: number;
	lang: Locale;
};

export const MenuUser: React.FC<MenuUserProps> = ({ dict, user, initialUnreadCount, lang }) => {
	const router = useRouter();

	// Configuración de navegación con traducciones

	// Función para cambiar idioma

	const handleSignOut = async () => {
		await signOut();
		router.refresh();
	};
	return (
		<div className="flex items-center gap-2">
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
						{dict.auth.logout}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};
