import { Navbar } from "@/components/navbar";
import { getCurrentUser } from "@/data/user";

export async function NavbarWrapper() {
	const user = await getCurrentUser();

	return <Navbar user={user} />;
}
