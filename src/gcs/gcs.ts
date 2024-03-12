import { Storage, StorageOptions } from "@google-cloud/storage";
import { ConnectionString } from "../connectionString";
import { IObjectStorage, PutOptions, StatResponse } from "../interface";
import { Writable, Readable } from "stream";
import { UnimplementedError } from "../errors";

export class GoogleCloudStorage implements IObjectStorage {
    private readonly client: Storage;
    private readonly bucketName: string;
    constructor(config: ConnectionString) {
        const clientConfig: StorageOptions = {};

        if (config.parameters !== undefined) {
            if ("endpoint" in config.parameters && typeof config.parameters.endpoint === "string") {
                clientConfig.apiEndpoint = config.parameters.endpoint;
            }

            if ("token" in config.parameters && typeof config.parameters.token === "string") {
                clientConfig.token = config.parameters.token;
            }

            if ("keyFilename" in config.parameters && typeof config.parameters.keyFilename === "string") {
                clientConfig.keyFilename = config.parameters.keyFilename;
            }
        }

        this.bucketName = config.bucketName;
        this.client = new Storage(clientConfig);
    }
    
    async put(path: string, content: string | Buffer, options?: PutOptions | undefined): Promise<void> {
        await this.client.bucket(this.bucketName)
            .file(path)
            .save(content, { metadata: options?.metadata, contentType: options?.contentType });
    }

    putStream(path: string, options?: PutOptions | undefined): Promise<Writable> {
        const bucket = this.client.bucket(this.bucketName);

        const file = bucket.file(path);

        return Promise.resolve(file.createWriteStream({
            metadata: options?.metadata,
            contentType: options?.contentType
        }));
    }
    
    async get(path: string, encoding?: string | undefined): Promise<Buffer> {
        const buffer = await this.client.bucket(this.bucketName)
            .file(path)
            .download();

        return buffer[0];
        // TODO: Wrap the function inside try catch and throw BlobFileNotExistError if path does not exist
    }
    
    getStream(path: string): Promise<Readable> {
        throw new UnimplementedError();
    }
    
    async stat(path: string): Promise<StatResponse> {
        const file = this.client.bucket(this.bucketName).file(path);

        const [metadata] = await file.getMetadata();
        return {
            size: metadata?.size ?? 0,
            createdTime: metadata?.timeCreated ?? new Date(0),
            lastModified: metadata?.updated ?? new Date(0),
            md5: metadata?.md5Hash as string | undefined,
            cacheControl: metadata?.cacheControl as string | undefined,
            contentDisposition: metadata?.contentDisposition as string | undefined,
            contentEncoding: metadata?.contentEncoding as string | undefined,
            contentLanguage: metadata?.contentLanguage as string | undefined,
            contentType: metadata?.contentType as string | undefined,
            etag: metadata?.etag as string | undefined
        };
    }
    
    async list(path?: string | undefined): Promise<Iterable<string>> {
        const files = await this.client.bucket(this.bucketName)
            .getFiles({ prefix: path });

        const objects: string[] = [];
        for (const file of files[0]) {
            objects.push(file.name);
        }

        return objects;
    }
    
    async exists(path: string): Promise<boolean> {
        const exists = await this.client.bucket(this.bucketName)
            .file(path)
            .exists();
    
        return exists[0];
    }
    
    async delete(path: string): Promise<void> {
        await this.client.bucket(this.bucketName)
            .file(path)
            .delete();
    }
    
    async copy(sourcePath: string, destinationPath: string): Promise<void> {
        await this.client.bucket(this.bucketName)
            .file(sourcePath)
            .copy(destinationPath);
    }
    
    async move(sourcePath: string, destinationPath: string): Promise<void> {
        await this.client.bucket(this.bucketName)
            .file(sourcePath)
            .move(destinationPath);
    }
}