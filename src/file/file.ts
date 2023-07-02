import { type IObjectStorage, type PutOptions, type StatResponse } from "../interface";
import { Readable, Writable } from "node:stream";
import { access, copyFile, rm, stat, readFile, open, cp, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { BlobFileNotExistError, BlobFilePermissionDeniedError, BlobMismatchedMD5IntegrityError } from "../errors";
import { dirname } from "node:path";
import { mkdir } from "fs/promises";

export class FileStorage implements IObjectStorage {
    private readonly basePath: string;

    constructor(basePath: string) {
        this.basePath = basePath;
    }

    async copy(sourcePath: string, destinationPath: string): Promise<void> {
        try {
            await copyFile(join(this.basePath, sourcePath), join(this.basePath, destinationPath));
        } catch (error: unknown) {
            if (typeof error === "object" && error != null && "code" in error) {
                if (error.code === "ENOENT" || error.code === "ENOTDIR") {
                    throw new BlobFileNotExistError(sourcePath);
                }
            }

            // Re-throw error
            throw error;
        }
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

    async get(path: string, encoding?: string): Promise<Buffer> {
        try {
            const content = await readFile(join(this.basePath, path), { flag: "r"});
            return content;
        } catch (error: unknown) {
            if (typeof error === "object" && error != null && "code" in error) {
                if (error.code === "ENOENT" || error.code === "ENOTDIR") {
                    throw new BlobFileNotExistError(path);
                }

                if (error.code === "EPERM") {
                    throw new BlobFilePermissionDeniedError(path);
                }
            }

            // Re-throw error
            throw error;
        }
    }

    async getStream(path: string): Promise<Readable> {
        try {
            const file = await open(join(this.basePath, path));

            return file.createReadStream({ autoClose: true, emitClose: true });
        } catch (error: unknown) {
            if (typeof error === "object" && error != null && "code" in error) {
                if (error.code === "ENOENT" || error.code === "ENOTDIR") {
                    throw new BlobFileNotExistError(path);
                }
            }

            // Re-throw error
            throw error;
        }
    }

    async list(path = "."): Promise<Array<string>> {
        let files: string[] = [];
        const directoryEntries = await readdir(join(this.basePath, path), { withFileTypes: true, recursive: true });
        for await (const directory of directoryEntries) {
            if (directory.isDirectory()) {
                const subdirectoryFiles = await this.list(join(path, directory.name));
                files = files.concat(subdirectoryFiles);
                continue;
            }

            files.push(join(path, directory.name));
        }

        return files;
    }

    async move(sourcePath: string, destinationPath: string): Promise<void> {
        try {
            await cp(join(this.basePath, sourcePath), join(this.basePath, destinationPath), { force: true, recursive: true });
            await rm(join(this.basePath, sourcePath), {force: true, recursive: true});
        } catch (error: unknown) {
            if (typeof error === "object" && error != null && "code" in error) {
                if (error.code === "ENOENT" || error.code === "ENOTDIR") {
                    throw new BlobFileNotExistError(sourcePath);
                }
            }

            // Re-throw error
            throw error;
        }
    }

    async put(path: string, content: Buffer | string, options?: PutOptions): Promise<void> {
        const directoryName = dirname(path);
        if (directoryName !== "" && directoryName !== ".") {
            await mkdir(join(this.basePath, directoryName), { recursive: true });
        }

        await writeFile(join(this.basePath, path), content, { mode: 0x644, flag: "w" });

        if (options?.contentMD5 !== undefined && options.contentMD5 !== "") {
            const hashFunc = createHash("md5");
            const contentStream = createReadStream(join(this.basePath, path));
            const updateDone = new Promise((resolve, reject) => {
                contentStream.on("data", data => hashFunc.update(data));
                contentStream.on("error", reject);
                contentStream.on("close", resolve);
            });
            await updateDone;
            const calculatedMD5 = hashFunc.digest("base64");

            if (options.contentMD5 !== calculatedMD5) {
                await this.delete(path);
                throw new BlobMismatchedMD5IntegrityError(options.contentMD5, calculatedMD5);
            }
        }
    }

    async putStream(path: string, options?: PutOptions): Promise<Writable> {
        const directoryName = dirname(path);
        if (directoryName !== "") {
            await mkdir(join(this.basePath, directoryName), { recursive: true });
        }

        const file = await open(join(this.basePath, path), "w");

        return file.createWriteStream({ autoClose: true, emitClose: true });
    }


    async stat(path: string): Promise<StatResponse> {
        try {
            const statd = await stat(join(this.basePath, path));
            return {
                createdTime: statd.birthtime,
                lastModified: statd.mtime,
                size: statd.size
            };
        } catch (error: unknown) {
            if (typeof error === "object" && error != null && "code" in error) {
                if (error.code === "ENOENT" || error.code === "ENOTDIR") {
                    throw new BlobFileNotExistError(path);
                }
            }

            // Re-throw error
            throw error;
        }
    }
}