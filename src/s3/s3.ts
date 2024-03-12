import { type IObjectStorage, type PutOptions, type StatResponse } from "../interface";
import { type ConnectionString } from "../connectionString";
import { Readable, Writable } from "node:stream";
import {
    CopyObjectCommand,
    DeleteObjectCommand, GetObjectAttributesCommand,
    GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, NoSuchKey,
    NotFound, PutObjectCommand,
    S3Client,
    type S3ClientConfig, S3ServiceException, CompleteMultipartUploadCommand, CreateMultipartUploadCommand, UploadPartCommand
} from "@aws-sdk/client-s3";
import { BlobFileNotExistError, BlobMismatchedMD5IntegrityError, UnimplementedError } from "../errors";

export class S3Storage implements IObjectStorage {
    private readonly client: S3Client;
    private readonly bucketName: string;
    constructor(config: ConnectionString) {
        const clientConfig: S3ClientConfig = {};

        if (config.username !== undefined && config.username !== "" && config.password !== undefined && config.password !== "") {
            clientConfig.credentials = {
                accessKeyId: config.username,
                secretAccessKey: config.password
            };
        }

        if (config.parameters !== undefined) {
            if ("region" in config.parameters && typeof config.parameters.region === "string") {
                clientConfig.region = config.parameters.region;
            } else {
                // See https://github.com/aws/aws-sdk-js-v3/issues/1845#issuecomment-754832210
                clientConfig.region = "us-east-1";
                clientConfig.disableHostPrefix = true;
            }

            if ("forcePathStyle" in config.parameters) {
                clientConfig.forcePathStyle = Boolean(config.parameters.forcePathStyle);
            }

            if ("useAccelerateEndpoint" in config.parameters) {
                clientConfig.useAccelerateEndpoint = Boolean(config.parameters.useAccelerateEndpoint);
            }

            if ("disableMultiregionAccessPoints" in config.parameters) {
                clientConfig.disableMultiregionAccessPoints = Boolean(config.parameters.disableMultiregionAccessPoints);
            }

            if ("endpoint" in config.parameters && typeof config.parameters.endpoint === "string") {
                clientConfig.endpoint = config.parameters.endpoint;
            }

            if ("disableHostPrefix" in config.parameters) {
                clientConfig.disableHostPrefix = Boolean(config.parameters.disableHostPrefix);
            }
        }

        this.client = new S3Client(clientConfig);
        this.bucketName = config.bucketName;
    }

    async copy(sourcePath: string, destinationPath: string): Promise<void> {
        try {
            const command = new CopyObjectCommand({
                Bucket: this.bucketName,
                CopySource: `${this.bucketName}/${sourcePath}`,
                Key: destinationPath
            });

            await this.client.send(command);
        } catch (error: unknown) {
            if (error instanceof NotFound || error instanceof NoSuchKey) {
                throw new BlobFileNotExistError(sourcePath);
            }

            if (typeof error === "object" && error != null && "Code" in error && error?.Code === "NoSuchKey") {
                throw new BlobFileNotExistError(sourcePath);
            }

            throw error;
        }
    }

    async delete(path: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: path
        });

        await this.client.send(command);
    }

    async exists(path: string): Promise<boolean> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: path
            });

            const response = await this.client.send(command);
            if (response.DeleteMarker !== undefined) {
                if (response.DeleteMarker) return false;
            }

            return true;
        } catch (error: unknown) {
            if (error instanceof NotFound || error instanceof NoSuchKey) {
                return false;
            }

            if (typeof error === "object" && error != null && "Code" in error && error?.Code === "NoSuchKey") {
                return false;
            }

            throw error;
        }
    }

    async get(path: string, encoding?: string): Promise<Buffer> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: path
            });

            const response = await this.client.send(command);

            if (response.Body == null) {
                throw new Error("this can't be happening");
            }

            const byteArray = await response.Body.transformToByteArray();
            return Buffer.from(byteArray.buffer);
        } catch (error: unknown) {
            if (error instanceof NotFound || error instanceof NoSuchKey) {
                throw new BlobFileNotExistError(path);
            }

            if (typeof error === "object" && error != null && "Code" in error && error?.Code === "NoSuchKey") {
                throw new BlobFileNotExistError(path);
            }

            throw error;
        }
    }

    async getStream(path: string): Promise<Readable> {
        throw new UnimplementedError();
    }

    async list(path?: string): Promise<Iterable<string>> {
        const command = new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: path
        });
        const response = await this.client.send(command);

        if (response.Contents == null) {
            return [];
        }

        const objects: string[] = [];

        for (const object of response.Contents) {
            if (object.Key == null) continue;

            objects.push(object.Key);
        }

        return objects;
    }

    async move(sourcePath: string, destinationPath: string): Promise<void> {
        await this.copy(sourcePath, destinationPath);
        await this.delete(sourcePath);
    }

    async put(path: string, content: Buffer | string, options?: PutOptions): Promise<void> {
        try {
            const command = new PutObjectCommand({
                Body: content,
                Bucket: this.bucketName,
                Key: path,
                CacheControl: options?.cacheControl,
                ContentType: options?.contentType,
                ContentLanguage: options?.contentLanguage,
                ContentDisposition: options?.contentDisposition,
                ContentEncoding: options?.contentEncoding,
                ContentMD5: options?.contentMD5,
                Metadata: options?.metadata
            });

            await this.client.send(command);
        } catch (error: unknown) {
            if (error instanceof S3ServiceException) {
                if (error.message === "The Content-Md5 you specified did not match what we received.") {
                    throw new BlobMismatchedMD5IntegrityError(options?.contentMD5 ?? "", "");
                }
            }

            throw error;
        }
    }

    async putStream(path: string, options?: PutOptions): Promise<Writable> {
        const command = new CreateMultipartUploadCommand({
            Bucket: this.bucketName,
            Key: path,
            Metadata: options?.metadata,
            CacheControl: options?.cacheControl,
            ContentEncoding: options?.contentEncoding,
            ContentDisposition: options?.contentDisposition,
            ContentType: options?.contentType,
            ContentLanguage: options?.contentLanguage
        });

        const response = await this.client.send(command);
        const uploadIdentifier = response.UploadId;

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const that = this;
        return new Writable({
            defaultEncoding: "binary",
            write(chunk: any, encoding: BufferEncoding, callback: (error?: (Error | null)) => void) {
                const command = new UploadPartCommand({
                    Body: chunk,
                    Bucket: that.bucketName,
                    Key: path,
                    UploadId: uploadIdentifier,
                    PartNumber: 0
                });

                that.client.send(command).catch((error: Error | null | undefined) => error ? callback(error) : callback(null));
            },
            writev(chunks: Array<{
                chunk: any;
                encoding: BufferEncoding;
            }>, callback: (error?: (Error | null)) => void) {
                for (let i = 0; i < chunks.length; i++) {
                    const command = new UploadPartCommand({
                        Body: chunks[i]?.chunk,
                        Bucket: that.bucketName,
                        Key: path,
                        UploadId: uploadIdentifier,
                        PartNumber: i
                    });

                    that.client.send(command).catch((error: Error | null | undefined) => error ? callback(error) : callback(null));
                }
            },
            final(callback: (error?: (Error | null)) => void) {
                const command = new CompleteMultipartUploadCommand({
                    Bucket: that.bucketName,
                    Key: path,
                    UploadId: uploadIdentifier
                });

                that.client.send(command).catch((error: Error | null | undefined) => {
                    if (error) {
                        callback(error);
                        return;
                    }

                    callback(null);
                });
            }
        });
    }

    async stat(path: string): Promise<StatResponse> {
        try {
            const command = new GetObjectAttributesCommand({
                Bucket: this.bucketName,
                Key: path,
                ObjectAttributes: ["ETag", "Checksum", "ObjectParts", "ObjectSize", "StorageClass"]
            });

            const response = await this.client.send(command);

            return {
                createdTime: new Date(0),
                etag: response.ETag ?? "",
                lastModified: response.LastModified ?? new Date(0),
                size: response.ObjectSize ?? 0
            };
        } catch (error: unknown) {
            if (error instanceof NotFound || error instanceof NoSuchKey) {
                throw new BlobFileNotExistError(path);
            }

            if (typeof error === "object" && error != null && "Code" in error && error?.Code === "NoSuchKey") {
                throw new BlobFileNotExistError(path);
            }

            throw error;
        }
    }
}