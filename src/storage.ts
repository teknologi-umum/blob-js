import { type IObjectStorage, PutOptions, StatResponse } from "./interface";
import { parseConnectionString } from "./connectionString";
import { FileStorage } from "./file/file";
import { Readable, Writable } from "node:stream";


export class Storage implements IObjectStorage {
    readonly #implementation: IObjectStorage;

    constructor(connectionString: string) {
        const parsedConnectionString = parseConnectionString(connectionString);
        switch (parsedConnectionString.provider) {
            case "file":
                this.#implementation = new FileStorage(parsedConnectionString.bucketName);
                break;
            // case "s3":
            //     this.#implementation = new S3Storage(parsedConnectionString);
            //     break;
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