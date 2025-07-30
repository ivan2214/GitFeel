export function NavbarSkeleton() {
	return (
		<nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<div className="flex items-center gap-2">
						<div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600" />
						<div className="h-6 w-20 animate-pulse rounded bg-muted" />
					</div>

					{/* Desktop Navigation */}
					<div className="hidden md:flex md:items-center md:gap-8">
						<div className="flex items-center gap-6">
							<div className="h-4 w-16 animate-pulse rounded bg-muted" />
							<div className="h-4 w-20 animate-pulse rounded bg-muted" />
						</div>
						<div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
					</div>

					{/* Mobile Menu Button */}
					<div className="md:hidden">
						<div className="h-8 w-8 animate-pulse rounded bg-muted" />
					</div>
				</div>
			</div>
		</nav>
	);
}
