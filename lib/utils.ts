import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const generateRandomColorTailwind = () => {
	/* ejemplo bg-purple-900/50 text-purple-300 */
	const colors = [
		"bg-red-500 text-white",
		"bg-orange-500 text-white",
		"bg-yellow-500 text-white",
		"bg-green-500 text-white",
		"bg-blue-500 text-white",
		"bg-purple-500 text-white",
		"bg-pink-500 text-white",
		"bg-gray-500 text-white",
		"bg-slate-500 text-white",
		"bg-lime-500 text-white",
		"bg-emerald-500 text-white",
	];
	return colors[Math.floor(Math.random() * colors.length)];
};
