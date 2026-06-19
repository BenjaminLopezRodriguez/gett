import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import "server-only";

import { env } from "@/env";

export const R2_BUCKETS = {
  CASES: env.R2_BUCKET_CASES,
  LEGAL_CORPUS: env.R2_BUCKET_LEGAL_CORPUS,
} as const;

export type R2Bucket = (typeof R2_BUCKETS)[keyof typeof R2_BUCKETS];

export function isR2Configured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY,
  );
}

function getR2Endpoint(): string {
  if (env.R2_ENDPOINT) return env.R2_ENDPOINT;
  return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}

let client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!isR2Configured()) {
    throw new Error("R2 is not configured");
  }

  client ??= new S3Client({
    region: "auto",
    endpoint: getR2Endpoint(),
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });

  return client;
}

export function buildDocumentStorageKey(
  caseId: string,
  documentId: string,
  filename: string,
): string {
  return `${caseId}/${documentId}/${filename}`;
}

export function buildPlaceholderStorageKey(
  caseId: string,
  documentId: string,
  filename: string,
): string {
  return `placeholder/${caseId}/${documentId}/${filename}`;
}

export async function uploadToBucket(
  bucket: R2Bucket,
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
}

export async function getFromBucket(
  bucket: R2Bucket,
  key: string,
): Promise<Buffer> {
  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error(`Empty response body for s3://${bucket}/${key}`);
  }

  return Buffer.from(await response.Body.transformToByteArray());
}

export async function deleteFromBucket(
  bucket: R2Bucket,
  key: string,
): Promise<void> {
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}
