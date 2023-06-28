import { type IObjectStorage, type PutOptions, type StatResponse } from "../interface";
import { type ConnectionString } from "../connectionString";
import { Readable, Writable } from "node:stream";
import {
    CopyObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand, ListObjectsV2Command,
    S3Client,
    type S3ClientConfig
} from "@aws-sdk/client-s3";

export class S3Storage implements IObjectStorage {
    private readonly client: S3Client;
    private readonly bucketName: string;
    constructor(config: ConnectionString) {
        let clientConfig: S3ClientConfig = {}
        this.client = new S3Client(clientConfig);
        this.bucketName = config.bucketName;
    }

    async copy(sourcePath: string, destinationPath: string): Promise<void> {
        const command = new CopyObjectCommand({
            Bucket: this.bucketName,
            CopySource: sourcePath,
            Key: destinationPath
        });

        await this.client.send(command);
    }

    async delete(path: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: path
        });

        await this.client.send(command);
    }

    exists(path: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    async get(path: string, encoding?: string): Promise<Buffer> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: path,
        });

        const response = await this.client.send(command);

        if (response.Body == null) {
            throw new Error("this can't be happening");
        }

        const byteArray = await response.Body.transformToByteArray();
        return Buffer.from(byteArray.buffer);
    }

    async getStream(path: string): Promise<Readable> {
        return new Readable();
    }

    async list(path?: string): Promise<Iterable<string>> {
        const command = new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: path
        });
        const response = await this.client.send(command);

        if (response.Contents == null) {
            throw new Error("handle this thing better")
        }

        const objects: string[] = [];

        for (const object of response.Contents) {
            if (object.Key == null) continue;

            objects.push(object.Key);
        }

        return objects;
    }

    move(sourcePath: string, destinationPath: string): Promise<void> {
        return Promise.resolve(undefined);
    }

    put(path: string, content: Uint8Array | ArrayBuffer | Buffer | string, options?: PutOptions): Promise<void> {
        return Promise.resolve(undefined);
    }

    putStream(path: string, options?: PutOptions): Promise<Writable> {
        return Promise.resolve(new Writable())
    }

    stat(path: string): Promise<StatResponse> {
        return Promise.resolve(undefined);
    }
}