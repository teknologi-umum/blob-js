import { type IObjectStorage, type PutOptions, type StatResponse } from "../interface";
import { Readable, Writable } from "node:stream";
import { access, copyFile, rm, stat, readFile, open, cp, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { BlobMismatchedMD5Integrity } from "../errors";

export class FileStorage implements IObjectStorage {
    private readonly basePath: string;

    constructor(basePath: string) {
        this.basePath = basePath;
    }

    async copy(sourcePath: string, destinationPath: string): Promise<void> {
        await copyFile(join(this.basePath, sourcePath), join(this.basePath, destinationPath));
    }

    async delete(path: string): Promise<void> {
        await rm(join(this.basePath, path), { force: true, recursive: true });
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
        return readFile(path, { encoding: null });
    }

    async getStream(path: string): Promise<Readable> {
        const file = await open(path);

        return file.createReadStream({ autoClose: true, emitClose: true });
    }

    async list(path = "."): Promise<Iterable<string>> {
        const files: string[] = [];
        const directoryEntries = await readdir(path, { withFileTypes: true, recursive: true });
        for await (const directory of directoryEntries) {
            if (directory.isDirectory()) {
                const subdirectoryFiles = await this.list(join(path, directory.name));
                files.push(...subdirectoryFiles);
                continue;
            }

            files.push(join(path, directory.name));
        }

        return files;
    }

    async move(sourcePath: string, destinationPath: string): Promise<void> {
        await cp(sourcePath, destinationPath, {force: true, recursive: true});
        await rm(sourcePath, {force: true, recursive: true});
    }

    async put(path: string, content: Buffer | string, options?: PutOptions): Promise<void> {
        await writeFile(path, content);

        if (options?.contentMD5 !== undefined && options.contentMD5 !== "") {
            const hashFunc = createHash("md5");
            const contentStream = createReadStream(path);
            const updateDone = new Promise((resolve, reject) => {
                contentStream.on("data", data => hashFunc.update(data));
                contentStream.on("error", reject);
                contentStream.on("close", resolve);
            });
            await updateDone;
            const calculatedMD5 = hashFunc.digest("base64");

            if (options.contentMD5 !== calculatedMD5) {
                throw new BlobMismatchedMD5Integrity(options.contentMD5, calculatedMD5);
            }
        }
    }

    async putStream(path: string, options?: PutOptions): Promise<Writable> {
        const file = await open(path, "w");

        return file.createWriteStream({ autoClose: true, emitClose: true });
    }


    async stat(path: string): Promise<StatResponse> {
        const statd = await stat(join(this.basePath, path));
        return {
            createdTime: statd.birthtime,
            lastModified: statd.mtime,
            size: statd.size

        };
    }
}