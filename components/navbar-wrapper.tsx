import { Navbar } from "@/components/navbar";
import { getCurrentUser } from "@/data/user";

export async function NavbarWrapper() {
	const currentUser = await getCurrentUser();

	return <Navbar currentUser={currentUser} />;
}
