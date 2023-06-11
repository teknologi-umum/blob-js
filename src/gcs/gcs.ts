import { type IObjectStorage, type PutOptions, type StatResponse } from "../interface";
import { type ConnectionString } from "../connectionString";
import { Readable, Writable } from "node:stream";

export class GcsStorage implements IObjectStorage {
    constructor(config: ConnectionString) {
    }

    copy(sourcePath: string, destinationPath: string): Promise<void> {
        return Promise.resolve(undefined);
    }

    delete(path: string): Promise<void> {
        return Promise.resolve(undefined);
    }

    exists(path: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    get(path: string, encoding?: string): Promise<Buffer> {
        return Promise.resolve(undefined);
    }

    getStream(path: string): Promise<Readable> {
        return Promise.resolve(undefined);
    }

    list(path?: string): Promise<Iterable<string>> {
        return Promise.resolve(undefined);
    }

    move(sourcePath: string, destinationPath: string): Promise<void> {
        return Promise.resolve(undefined);
    }

    put(path: string, content: Uint8Array | ArrayBuffer | Buffer | string, options?: PutOptions): Promise<void> {
        return Promise.resolve(undefined);
    }

    putStream(path: string, options?: PutOptions): Writable {
        return undefined;
    }

    stat(path: string): Promise<StatResponse> {
        return Promise.resolve(undefined);
    }
}