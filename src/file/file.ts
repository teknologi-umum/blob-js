import { type IObjectStorage, type PutOptions, type StatResponse } from "../interface";
import { Readable, Writable } from "node:stream";
import { access, copyFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";

export class FileStorage implements IObjectStorage {
    private readonly basePath: string;

    constructor(basePath: string) {
        this.basePath = basePath;
    }

    async copy(sourcePath: string, destinationPath: string): Promise<void> {
        await copyFile(join(this.basePath, sourcePath), join(this.basePath, destinationPath));
    }

    async delete(path: string): Promise<void> {
        await rm(join(this.basePath, path), {force: true, recursive: true})
    }

    async exists(path: string): Promise<boolean> {
        try {
            await access(join(this.basePath, path));
            return Promise.resolve(true);
        } catch {
            return Promise.resolve(false);
        }
    }

    get(path: string, encoding?: string): Promise<Buffer> {
        // TODO
        return Promise.resolve(undefined);
    }

    getStream(path: string): Promise<Readable> {
        // TODO
        return Promise.resolve(undefined);
    }

    list(path?: string): Promise<Iterable<string>> {
        // TODO
        return Promise.resolve(undefined);
    }

    move(sourcePath: string, destinationPath: string): Promise<void> {
        // TODO
        return Promise.resolve(undefined);
    }

    put(path: string, content: Uint8Array | ArrayBuffer | Buffer | string, options?: PutOptions): Promise<void> {
        // TODO
        return Promise.resolve(undefined);
    }

    putStream(path: string, options?: PutOptions): Writable {
        // TODO
        return undefined;
    }

    async stat(path: string): Promise<StatResponse> {
        const statd = await stat(join(this.basePath, path));
        return {
            createdTime: statd.birthtime,
            lastModified: statd.mtime,
            size: statd.size

        }
    }

}