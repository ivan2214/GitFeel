"use server";

import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import prisma from "../prisma";

const s3Client = new S3Client({
	region: process.env.AWS_REGION || "",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
	},
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "";

export async function generatePresignedUploadUrl({
	filename,
	contentType,
	size,
}: {
	filename: string;
	contentType: string;
	size: number;
}) {
	try {
		// Validaciones
		if (size > 10 * 1024 * 1024) {
			// 10MB
			return { error: "El archivo es demasiado grande. Máximo 10MB." };
		}

		if (!contentType.startsWith("image/")) {
			return { error: "Solo se permiten imágenes." };
		}

		// Generar key único
		const fileExtension = filename.split(".").pop();
		const key = `uploads/${uuidv4()}.${fileExtension}`;

		// Crear comando para subir archivo
		const command = new PutObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
			ContentType: contentType,
		});

		// Generar URL firmada
		const presignedUrl = await getSignedUrl(s3Client, command, {
			expiresIn: 3600, // 1 hora
		});

		return {
			presignedUrl,
			key,
		};
	} catch (error) {
		console.error("Error generating presigned URL:", error);
		return { error: "Error al generar URL de subida" };
	}
}

export async function deleteS3Object({ key }: { key: string }) {
	try {
		const command = new DeleteObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
		});

		await s3Client.send(command);

		await prisma.uploadedFile.deleteMany({
			where: {
				key,
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Error deleting S3 object:", error);
		return {
			success: false,
			error: "Error al eliminar archivo",
		};
	} finally {
		revalidatePath("/dashboard");
	}
}
