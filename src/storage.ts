import { Readable, Writable } from "node:stream";
import { type IObjectStorage, PutOptions, StatResponse } from "./interface";
import { parseConnectionString } from "./connectionString";
import { FileStorage } from "./file/file";
import { S3Storage } from "./s3/s3";
import { MinioStorage } from "./s3/minio";

/**
 * The Storage class implements the `IObjectStorage` interface and provides a way to interact
 * with an object storage service. The class takes a connection string as input and uses it
 * to initialize the appropriate implementation class for the specified provider.
 */
export class Storage implements IObjectStorage {
    readonly #implementation: IObjectStorage;

    /**
     * The Storage constructor takes a `connectionString` as input and uses it to initialize
     * the appropriate implementation class for the specified provider.
     * The `connectionString` is a string that specifies the connection information for
     * the object storage service. The format of the `connectionString` depends on the provider.
     *
     * The following are the supported providers and their respective connection string formats:
     *
     * * AWS (or any other S3-compatible storage): s3://access_key:secret_key@bucket_name?forcePathStyle=true&customUserAgent=your_user_agent&more_config=more_value
     * * Google Cloud: gcs://bucket_name
     * * Azure Blob: azblob://my_container
     * * Filesystem: file:///path/to/directory
     * 
     * Note: Using any other schemes than s3, gcs, azblob or file will throw a TypeError.
     *
     * For example, the following is a valid connectionString for AWS S3:
     *
     * s3://access_key:secret_key@my-bucket?forcePathStyle=true&customUserAgent=my_user_agent&more_config=more_value
     * @param connectionString Connection string that specifies the connection information for the object storage service
     * @throws TypeError Unknown or unsupported schemes/provider was given
     */
    constructor(connectionString: string) {
        const parsedConnectionString = parseConnectionString(connectionString);
        switch (parsedConnectionString.provider) {
            case "file":
                this.#implementation = new FileStorage(parsedConnectionString.bucketName);
                break;
            case "s3":
                if (parsedConnectionString.parameters?.useMinioSdk === "true") {
                    this.#implementation = new MinioStorage(parsedConnectionString);
                } else {
                    this.#implementation = new S3Storage(parsedConnectionString);
                }
                break;
            // case "azblob":
            //     this.#implementation = new AzureBlobStorage(parsedConnectionString);
            //     break;
            // case "gcs":
            //     this.#implementation = new GcsStorage(parsedConnectionString);
            //     break;
            default:
                throw new TypeError("Invalid provider");
        }
    }

    copy(sourcePath: string, destinationPath: string): Promise<void> {
        return this.#implementation.copy(sourcePath, destinationPath);
    }

    delete(path: string): Promise<void> {
        return this.#implementation.delete(path);
    }

    exists(path: string): Promise<boolean> {
        return this.#implementation.exists(path);
    }

    get(path: string, encoding?: string): Promise<Buffer> {
        return this.#implementation.get(path, encoding);
    }

    getStream(path: string): Promise<Readable> {
        return this.#implementation.getStream(path);
    }

    list(path?: string): Promise<Iterable<string>> {
        return this.#implementation.list(path);
    }

    move(sourcePath: string, destinationPath: string): Promise<void> {
        return this.#implementation.move(sourcePath, destinationPath);
    }

    put(path: string, content: Buffer | string, options?: PutOptions): Promise<void> {
        return this.#implementation.put(path, content, options);
    }

    putStream(path: string, options?: PutOptions): Promise<Writable> {
        return this.#implementation.putStream(path, options);
    }

    stat(path: string): Promise<StatResponse> {
        return this.#implementation.stat(path);
    }
}