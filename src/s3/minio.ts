import { join } from "node:path";
import { buffer } from "node:stream/consumers";

import * as Minio from "minio";
import { Readable, Writable } from "stream";

import { ConnectionString } from "../connectionString";
import type { IObjectStorage, PutOptions, StatResponse } from "../interface";
import { UnimplementedError } from "../errors";

export class MinioStorage implements IObjectStorage {
    private readonly client: Minio.Client;
    private readonly bucketName: string;

    constructor(config: ConnectionString) {
        const clientOptions: Minio.ClientOptions = {
            endPoint: "",
            accessKey: "",
            secretKey: ""
        };
        if (config.username !== undefined && config.username !== "" && config.password !== undefined && config.password !== "") {
            clientOptions.accessKey = config.username;
            clientOptions.secretKey = config.password;
        }

        if (config.parameters !== undefined) {
            if ("region" in config.parameters && typeof config.parameters.region === "string") {
                clientOptions.region = config.parameters.region;
            } else {
                // See https://github.com/aws/aws-sdk-js-v3/issues/1845#issuecomment-754832210
                clientOptions.region = "us-east-1";
                clientOptions.pathStyle = true;
            }

            if ("forcePathStyle" in config.parameters) {
                clientOptions.pathStyle = Boolean(config.parameters.forcePathStyle);
            }

            if ("useAccelerateEndpoint" in config.parameters) {
                clientOptions.s3AccelerateEndpoint = config.parameters.useAccelerateEndpoint;
            }

            if ("endpoint" in config.parameters && typeof config.parameters.endpoint === "string") {
                clientOptions.endPoint = config.parameters.endpoint;
            }

            if ("useSSL" in config.parameters) {
                clientOptions.useSSL = ["true", "1", "yes", "y"].includes(config.parameters.useSSL.toLowerCase());
            }

            if ("port" in config.parameters) {
                clientOptions.port = Number.parseInt(config.parameters.port);
            }
        }

        this.client = new Minio.Client(clientOptions);
        this.bucketName = config.bucketName;
    }

    async put(path: string, content: string | Buffer, options?: PutOptions | undefined): Promise<void> {
        await this.client.putObject(this.bucketName, path, content, undefined, options?.metadata);
    }

    putStream(path: string, options?: PutOptions | undefined): Promise<Writable> {
        throw new UnimplementedError();
    }

    async get(path: string, encoding?: string | undefined): Promise<Buffer> {
        const response = await this.client.getObject(this.bucketName, path);
        return buffer(response);
    }

    getStream(path: string): Promise<Readable> {
        return this.client.getObject(this.bucketName, path);
    }

    async stat(path: string): Promise<StatResponse> {
        const response = await this.client.statObject(this.bucketName, path);
        return {
            size: response.size,
            lastModified: response.lastModified,
            createdTime: new Date(0),
            etag: response.etag,
            metadata: response.metaData
        };
    }

    list(path?: string | undefined): Promise<Iterable<string>> {
        return new Promise((resolve, reject) => {
            const listStream = this.client.listObjectsV2(this.bucketName, path, false);
            const objects: string[] = [];
            listStream.on("end", () => {
                resolve(objects);
            });

            listStream.on("data", (item) => {
                if (item.name !== undefined) {
                    objects.push(item.name);
                }
            });

            listStream.on("error", (error) => {
                reject(error);
            });
        });
    }

    async exists(path: string): Promise<boolean> {
        try {
            await this.client.statObject(this.bucketName, path);
            return true;
        } catch (error: unknown) {
            if (error instanceof Minio.S3Error) {
                if (error.code === "NoSuchKey") {
                    return false;
                }
            }

            throw error;
        }
    }

    async delete(path: string): Promise<void> {
        await this.client.removeObject(this.bucketName, path);
    }

    async copy(sourcePath: string, destinationPath: string): Promise<void> {
        await this.client.copyObject(this.bucketName, destinationPath, join(this.bucketName, sourcePath));
    }

    async move(sourcePath: string, destinationPath: string): Promise<void> {
        await this.copy(sourcePath, destinationPath);
        await this.delete(sourcePath);
    }
}