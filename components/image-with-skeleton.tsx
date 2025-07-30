"use client";

import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ImageWithSkeletonProps = {
	src: string;
	alt: string;
	className?: string;
	objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
	priority?: boolean;
};

export const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({ src, alt, className = "", objectFit = "cover", priority = false }) => {
	const [isLoading, setIsLoading] = useState(true);

	const handleImageLoad = () => {
		setIsLoading(false);
	};

	return (
		<div className="relative" style={{ width: "100%", height: "100%" }}>
			{isLoading && (
				<Skeleton
					className="absolute inset-0"
					style={{
						width: "100%",
						height: "100%",
					}}
				/>
			)}
			<Image
				alt={alt}
				className={cn("h-full w-full transition-opacity duration-300", className, isLoading && "opacity-0")}
				loading={priority ? "eager" : "lazy"}
				onLoad={handleImageLoad}
				src={src}
				style={{ objectFit }}
			/>
		</div>
	);
};
