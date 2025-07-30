"use client";

import { Check, File, Loader2, StarIcon, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { ImageWithSkeleton } from "@/components/image-with-skeleton";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useS3Uploader } from "@/hooks/use-s3-uploader";
import { cn } from "@/lib/utils";

export interface UploadedFile {
	url: string;
	key: string;
	name?: string | null;
	size?: number | null;
	isMainImage: boolean;
}

const isUploadedFile = (val: UploadedFile | UploadedFile[] | null | undefined): val is UploadedFile => !!val && !Array.isArray(val);

const isValueArray = (val: UploadedFile | UploadedFile[] | null | undefined): val is UploadedFile[] => Array.isArray(val);

const uploadFile = async (
	file: File,
	isMainImage: boolean,
	uploadToS3: (file: File) => Promise<{ key?: string; presignedUrl?: string; error?: string }>,
	setUploadProgress: (progress: number) => void,
): Promise<UploadedFile | null> => {
	try {
		const { key, presignedUrl, error } = await uploadToS3(file);

		if (!presignedUrl || error || !key) {
			toast.error(error || "Error al subir");
			return null;
		}

		await new Promise<void>((resolve, reject) => {
			const xhr = new XMLHttpRequest();

			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					const percent = Math.round((event.loaded / event.total) * 100);
					setUploadProgress(percent);
				}
			};

			xhr.onload = () => {
				if (xhr.status === 200 || xhr.status === 204) resolve();
				else reject(new Error("Falló la subida"));
			};

			xhr.open("PUT", presignedUrl);
			xhr.setRequestHeader("Content-Type", file.type);
			xhr.send(file);
		});

		return {
			url: presignedUrl,
			key: key,
			name: file.name,
			size: file.size,
			isMainImage: isMainImage,
		};
	} catch {
		toast.error("Error al subir archivo");
		return null;
	}
};

interface UploaderProps {
	variant?: "default" | "compact" | "minimal" | "avatar";
	maxFiles?: number;
	maxSize?: number; // in MB
	accept?: string[];
	preview?: "grid" | "list";
	onChange: (files: (UploadedFile | UploadedFile[]) | null) => void;
	value?: UploadedFile | UploadedFile[] | null;
	disabled?: boolean;
	className?: string;
	placeholder?: string;
}

export function Uploader({
	variant = "default",
	maxFiles = 5,
	maxSize = 10,
	accept = ["image/*"],
	preview = "grid",
	onChange,
	value,
	disabled = false,
	className,
	placeholder,
}: UploaderProps) {
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const { uploadToS3, deleteFromS3 } = useS3Uploader();

	const canUploadMoreFiles = (value: UploadedFile | UploadedFile[] | null | undefined, max = maxFiles): boolean => {
		if (!value) return true;
		if (Array.isArray(value)) return value.length < max;
		return max > 1 ? 1 < max : false;
	};

	const handleMainImage = useCallback(
		(key: string) => {
			if (isValueArray(value)) {
				const oldMainImage = value.find((file) => file.isMainImage);
				if (oldMainImage) {
					oldMainImage.isMainImage = false;
				}
				const newMainImage = value.find((file) => file.key === key);
				if (newMainImage) {
					newMainImage.isMainImage = true;
				}
				onChange(value);
			}
		},
		[onChange, value], // ✅ CORRECTO
	);

	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			if (disabled) return;

			if ((isValueArray(value) ? value.length : 0) + acceptedFiles.length > maxFiles) {
				toast.error(`Máximo ${maxFiles} archivos permitidos`);
				return;
			}

			const oversized = acceptedFiles.filter((f) => f.size > maxSize * 1024 * 1024);
			if (oversized.length > 0) {
				toast.error(`Archivo(s) muy grande(s). Máximo ${maxSize}MB`);
				return;
			}

			setUploading(true);
			setUploadProgress(0);

			const uploadedArray: UploadedFile[] = [];
			let uploaded: UploadedFile | null = null;

			if (isValueArray(value)) {
				for (let i = 0; i < acceptedFiles.length; i++) {
					// solo es principal si no tiene nada el array de imagenes cargadas y el index es 0
					const isMainImage = !value.length && i === 0;

					const result = await uploadFile(acceptedFiles[i], isMainImage, uploadToS3, setUploadProgress);

					if (result) uploadedArray?.push(result);
				}
				if (uploadedArray.length > 0) {
					onChange([...value, ...uploadedArray]);

					toast.success(`${uploadedArray.length} archivo(s) subido(s)`);
				}
			} else {
				const isMainImage = !value;

				uploaded = await uploadFile(acceptedFiles[0], isMainImage, uploadToS3, setUploadProgress);

				onChange(uploaded);
				toast.success("Archivo subido");
			}

			setUploading(false);
			setUploadProgress(0);
		},
		[disabled, maxFiles, maxSize, onChange, value, uploadToS3],
	);

	const rejectedFiles = useCallback((fileRejection: FileRejection[]) => {
		if (fileRejection.length) {
			const tooMany = fileRejection.find((r) => r.errors[0].code === "too-many-files");
			const tooBig = fileRejection.find((r) => r.errors[0].code === "file-too-large");
			if (tooMany) toast.error("Demasiados archivos. Solo se permite uno por vez.");
			if (tooBig) toast.error("Archivo demasiado grande. Máximo 10MB.");
		}
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		onDropRejected: rejectedFiles,

		accept: accept.reduce(
			(acc, type) => {
				acc[type] = [];
				return acc;
			},
			{} as Record<string, string[]>,
		),
		maxFiles: maxFiles - (isValueArray(value) ? value.length : 0),
		disabled: disabled || uploading,
		maxSize: maxSize * 1024 * 1024, // in bytes
	});

	const removeFile = async (keyToRemove: string) => {
		if (disabled) return;
		try {
			await deleteFromS3(keyToRemove);
			if (isValueArray(value)) {
				const newValuesWithoutRemoved = value.filter((file) => file.key !== keyToRemove);
				// actualizar el isMainImage a la primera imagen de la lista
				if (newValuesWithoutRemoved.length > 0) {
					const firstFile = newValuesWithoutRemoved[0];
					firstFile.isMainImage = true;
					newValuesWithoutRemoved[0] = firstFile;
					onChange(newValuesWithoutRemoved);
				}
				//onChange(value?.filter((file) => file.key !== keyToRemove));
			} else {
				onChange(null);
			}
			toast.success("Archivo eliminado");
		} catch {
			toast.error("Error al eliminar");
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const isImage = (file: UploadedFile) => {
		return file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || file.url?.includes("image");
	};

	if (variant === "avatar") {
		return (
			<div className={cn("space-y-2", className)}>
				{!uploading && canUploadMoreFiles(value, maxFiles) && (
					<div
						{...getRootProps()}
						className={cn(
							"h-32 w-32 cursor-pointer rounded-full border-2 border-dashed p-4 text-center transition-colors",
							isDragActive ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400",
							disabled && "cursor-not-allowed opacity-50",
						)}
					>
						<input {...getInputProps()} />
						<Upload className="mx-auto mb-2 text-gray-400" />
						<p className="text-gray-600 text-xs">{placeholder || "Arrastra archivos o haz clic para seleccionar"}</p>
					</div>
				)}

				{uploading && <Progress className="h-2" value={uploadProgress} />}

				{isUploadedFile(value) && (
					<Card className="w-fit">
						<CardContent className="flex items-center gap-4">
							<div className="group relative h-32 w-32">
								<ImageWithSkeleton
									alt={value.name || "Avatar"}
									className="h-full min-h-32 w-full min-w-32 rounded-full border-4 border-gray-200"
									src={value.url || "/placeholder.svg"}
								/>
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button
											className="absolute top-0 right-0 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
											disabled={disabled}
											size="icon"
											type="button"
											variant="destructive"
										>
											<X className="h-3 w-3" />
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Estas seguro de eliminar esta imagen?</AlertDialogTitle>
											<AlertDialogDescription>
												Esta acción no se puede deshacer. Es permanente (no se puede recuperar, deberas subir una nueva).
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancelar</AlertDialogCancel>
											<AlertDialogAction
												className="bg-destructive text-white hover:bg-destructive/90"
												onClick={() => removeFile(value.key)}
											>
												Eliminar
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		);
	}

	if (variant === "minimal") {
		return (
			<div className={cn("space-y-2", className)}>
				{!uploading && canUploadMoreFiles(value, maxFiles) && (
					<div
						{...getRootProps()}
						className={cn(
							"cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors",
							isDragActive ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400",
							disabled && "cursor-not-allowed opacity-50",
						)}
					>
						<input {...getInputProps()} />
						<Upload className="mx-auto mb-2 h-6 w-6 text-gray-400" />
						<p className="text-gray-600 text-sm">{placeholder || "Arrastra archivos o haz clic para seleccionar"}</p>
					</div>
				)}

				{uploading && (
					<div className="space-y-2">
						<Progress className="h-2" value={uploadProgress} />
						<p className="text-center text-gray-500 text-xs">Subiendo... {uploadProgress}%</p>
					</div>
				)}

				{isValueArray(value) && value?.length > 0 ? (
					<div className="space-y-1">
						{value?.map((file) => (
							<div className="flex items-center justify-between rounded bg-gray-50 p-2" key={file.key}>
								<span className="truncate text-sm">{file.name || "Archivo"}</span>
								<Button disabled={disabled} onClick={() => removeFile(file.key)} size="sm" type="button" variant="ghost">
									<X className="h-3 w-3" />
								</Button>
							</div>
						))}
					</div>
				) : (
					isUploadedFile(value) && (
						<div className="space-y-1">
							<div className="flex items-center justify-between rounded bg-gray-50 p-2" key={value.key}>
								<span className="truncate text-sm">{value.name || "Archivo"}</span>
								<Button disabled={disabled} onClick={() => removeFile(value.key)} size="sm" type="button" variant="ghost">
									<X className="h-3 w-3" />
								</Button>
							</div>
						</div>
					)
				)}
			</div>
		);
	}

	if (variant === "compact") {
		return (
			<div className={cn("space-y-3", className)}>
				{!uploading && canUploadMoreFiles(value, maxFiles) && (
					<div
						{...getRootProps()}
						className={cn(
							"cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
							isDragActive ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400",
							disabled && "cursor-not-allowed opacity-50",
						)}
					>
						<input {...getInputProps()} />
						<Upload className="mx-auto mb-3 h-8 w-8 text-gray-400" />
						<p className="mb-1 font-medium text-gray-700 text-sm">{placeholder || "Subir archivos"}</p>
						<p className="text-gray-500 text-xs">
							Máximo {maxFiles} archivos, {maxSize}MB cada uno
						</p>
					</div>
				)}

				{uploading && (
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<Loader2 className="h-4 w-4 animate-spin" />
								<div className="flex-1">
									<Progress className="h-2" value={uploadProgress} />
								</div>
								<span className="text-gray-500 text-sm">{uploadProgress}%</span>
							</div>
						</CardContent>
					</Card>
				)}

				{isValueArray(value) && value?.length > 0 ? (
					<Card>
						<CardContent className="grid grid-cols-2 gap-2">
							{value?.map((file) => (
								<div className="group relative" key={file.key}>
									{isImage(file) ? (
										<div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
											<ImageWithSkeleton
												alt={file.name || "Imagen"}
												className="object-cover"
												src={file.url || "/placeholder.svg"}
											/>
										</div>
									) : (
										<div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100">
											<File className="h-8 w-8 text-gray-400" />
										</div>
									)}
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												className="absolute top-0 right-0 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
												disabled={disabled}
												size="icon"
												type="button"
												variant="destructive"
											>
												<X className="h-3 w-3" />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Estas seguro de eliminar esta imagen?</AlertDialogTitle>
												<AlertDialogDescription>
													Esta acción no se puede deshacer. Es permanente (no se puede recuperar, deberas subir una nueva).
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancelar</AlertDialogCancel>
												<AlertDialogAction
													className="bg-destructive text-white hover:bg-destructive/90"
													onClick={() => removeFile(file.key)}
												>
													Eliminar
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							))}
						</CardContent>
					</Card>
				) : (
					isUploadedFile(value) && (
						<Card className="w-fit">
							<CardContent>
								<div className="group relative h-48 w-48" key={value.key}>
									{isImage(value) ? (
										<div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
											<ImageWithSkeleton
												alt={value.name || "Imagen"}
												className="object-cover"
												src={value.url || "/placeholder.svg"}
											/>
										</div>
									) : (
										<div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100">
											<File className="h-8 w-8 text-gray-400" />
										</div>
									)}
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												className="absolute top-0 right-0 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
												disabled={disabled}
												size="icon"
												type="button"
												variant="destructive"
											>
												<X className="h-3 w-3" />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Estas seguro de eliminar esta imagen?</AlertDialogTitle>
												<AlertDialogDescription>
													Esta acción no se puede deshacer. Es permanente (no se puede recuperar, deberas subir una nueva).
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancelar</AlertDialogCancel>
												<AlertDialogAction
													className="bg-destructive text-white hover:bg-destructive/90"
													onClick={() => removeFile(value.key)}
												>
													Eliminar
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							</CardContent>
						</Card>
					)
				)}
			</div>
		);
	}

	// Default variant
	return (
		<div className={cn("space-y-4", className)}>
			{/* solo mostrar para subir si es que todavia no se alcanzo el maximo de archivos a subir */}
			{!uploading && canUploadMoreFiles(value, maxFiles) && (
				<div
					{...getRootProps()}
					className={cn(
						"cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
						isDragActive ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400",
						disabled && "cursor-not-allowed opacity-50",
					)}
				>
					<input {...getInputProps()} />
					<div className="space-y-4">
						<div className="flex justify-center">
							<div className="rounded-full bg-gray-100 p-3">
								<Upload className="h-8 w-8 text-gray-600" />
							</div>
						</div>

						<div>
							<p className="mb-2 font-medium text-gray-700 text-lg">
								{isDragActive ? "Suelta los archivos aquí" : placeholder || "Arrastra archivos aquí"}
							</p>
							<p className="mb-4 text-gray-500 text-sm">o haz clic para seleccionar archivos</p>
							<div className="flex justify-center gap-4 text-gray-400 text-xs">
								<span>Máximo {maxFiles} archivos</span>
								<span>•</span>
								<span>Hasta {maxSize}MB cada uno</span>
							</div>
						</div>

						<Button disabled={disabled || uploading} type="button" variant="outline">
							Seleccionar archivos
						</Button>
					</div>
				</div>
			)}

			{uploading && (
				<Card>
					<CardContent className="p-6">
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="font-medium text-sm">Subiendo archivos...</span>
								<span className="text-gray-500 text-sm">{uploadProgress}%</span>
							</div>
							<Progress className="h-2" value={uploadProgress} />
						</div>
					</CardContent>
				</Card>
			)}

			{isValueArray(value) && value?.length > 0 ? (
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h4 className="font-medium text-sm">Archivos subidos ({value?.length})</h4>
						<Badge variant="secondary">
							{value?.length}/{maxFiles}
						</Badge>
					</div>

					{preview === "grid" ? (
						<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
							{value?.map((file) => (
								<div className="group relative" key={file.key}>
									<Card className="overflow-hidden p-0">
										<CardContent className="p-0">
											{isImage(file) ? (
												<div className="relative h-20 w-20 overflow-hidden">
													<ImageWithSkeleton
														alt={file.name || "Imagen"}
														className="aspect-square h-full w-full object-cover"
														src={file.url || "/placeholder.svg"}
													/>
													{file.isMainImage && (
														<Button className="absolute top-2 left-2 h-6 w-6" size="icon" type="button" variant="outline">
															<StarIcon className="h-4 w-4 text-yellow-500" />
														</Button>
													)}
												</div>
											) : (
												<div className="flex aspect-square items-center justify-center bg-gray-50">
													<File className="h-12 w-12 text-gray-400" />
												</div>
											)}
											<div className="p-3">
												<p className="truncate font-medium text-xs">{file.name || "Archivo"}</p>
												{file.size && <p className="text-gray-500 text-xs">{formatFileSize(file.size)}</p>}
											</div>
										</CardContent>
									</Card>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												className="-top-2 -right-2 absolute h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
												disabled={disabled}
												size="icon"
												type="button"
												variant="destructive"
											>
												<X className="h-3 w-3" />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Estas seguro de eliminar esta imagen?</AlertDialogTitle>
												<AlertDialogDescription>Esta acción no se puede deshacer. Es permanente.</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancelar</AlertDialogCancel>
												<AlertDialogAction
													className="bg-destructive text-white hover:bg-destructive/90"
													onClick={() => removeFile(file.key)}
												>
													Eliminar
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
									{!file.isMainImage && (
										<Button
											className="absolute top-2 left-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
											disabled={disabled}
											onClick={() => handleMainImage(file.key)}
											size="icon"
											type="button"
											variant="outline"
										>
											<StarIcon className="h-4 w-4 text-yellow-500" />
										</Button>
									)}
								</div>
							))}
						</div>
					) : (
						<div className="space-y-2">
							{value?.map((file) => (
								<Card key={file.key}>
									<CardContent className="p-4">
										<div className="flex items-center gap-3">
											{isImage(file) ? (
												<div className="relative h-12 w-12 overflow-hidden rounded bg-gray-100">
													<ImageWithSkeleton
														alt={file.name || "Imagen"}
														className="object-cover"
														src={file.url || "/placeholder.svg"}
													/>
												</div>
											) : (
												<div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
													<File className="h-6 w-6 text-gray-400" />
												</div>
											)}

											<div className="min-w-0 flex-1">
												<p className="truncate font-medium text-sm">{file.name || "Archivo"}</p>
												{file.size && <p className="text-gray-500 text-xs">{formatFileSize(file.size)}</p>}
											</div>

											<div className="flex items-center gap-2">
												<Badge className="flex items-center gap-1" variant="secondary">
													<Check className="h-3 w-3" />
													Subido
												</Badge>
												<Button
													disabled={disabled}
													onClick={() => removeFile(file.key)}
													size="icon"
													type="button"
													variant="ghost"
												>
													<X className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</div>
			) : (
				isUploadedFile(value) && (
					<div className="space-y-2">
						<Card key={value.key}>
							<CardContent className="p-4">
								<div className="flex items-center gap-3">
									{isImage(value) ? (
										<div className="relative h-12 w-12 overflow-hidden rounded bg-gray-100">
											<ImageWithSkeleton
												alt={value.name || "Imagen"}
												className="object-cover"
												src={value.url || "/placeholder.svg"}
											/>
										</div>
									) : (
										<div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
											<File className="h-6 w-6 text-gray-400" />
										</div>
									)}

									<div className="min-w-0 flex-1">
										<p className="truncate font-medium text-sm">{value.name || "Archivo"}</p>
										{value.size && <p className="text-gray-500 text-xs">{formatFileSize(value.size)}</p>}
									</div>

									<div className="flex items-center gap-2">
										<Badge className="flex items-center gap-1" variant="secondary">
											<Check className="h-3 w-3" />
											Subido
										</Badge>
										<Button disabled={disabled} onClick={() => removeFile(value.key)} size="icon" type="button" variant="ghost">
											<X className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)
			)}
		</div>
	);
}
