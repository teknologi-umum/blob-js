import { afterEach, beforeAll, describe, it, expect, afterAll } from "vitest";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { loremIpsum } from "lorem-ipsum";
import { FileStorage } from "../../src/file/file";
import { createHash } from "node:crypto";
import { BlobFileNotExistError, BlobMismatchedMD5IntegrityError } from "../../src/errors";

describe("File Provider - Unit", () => {
    let temporaryDirectory: string;

    beforeAll(async () => {
        if (process.env?.TEMP_DIR) {
            temporaryDirectory = await mkdtemp(join(process.env.TEMP_DIR, "blob-js"));
        } else {
            temporaryDirectory = await mkdtemp(join(realpathSync(tmpdir()), "blob-js"));
        }
    });

    afterEach(async () => {
        await rm(temporaryDirectory, { force: true, recursive: true });
        await mkdir(temporaryDirectory, { recursive: true });
    });

    afterAll(async () => {
        await rm(temporaryDirectory, { force: true, recursive: true });
    });

    it("should be able to write a normal file", () => {
        const content = loremIpsum({ count: 512, format: "plain", units: "sentences" });

        const fileStorage = new FileStorage(temporaryDirectory);

        expect(fileStorage.put("normal-file.txt", content))
            .resolves
            .ok;
    });

    it("should be able to write a normal file with md5 checksum", () => {
        const content = loremIpsum({ count: 512, format: "plain", units: "sentences" });
        const hashFunc = createHash("md5");
        hashFunc.update(content);
        const checksum = hashFunc.digest("base64");

        const fileStorage = new FileStorage(temporaryDirectory);

        expect(fileStorage.put("md5-checksum.txt", content, { contentMD5: checksum }))
            .resolves
            .ok;
    });

    it("should throw an error for invalid md5 checksum", () => {
        const content = loremIpsum({ count: 512, format: "plain", units: "sentences" });
        const hashFunc = createHash("md5");
        hashFunc.update(content);
        const checksum = hashFunc.digest("base64");

        const fileStorage = new FileStorage(temporaryDirectory);

        expect(fileStorage.put("invalid-md5-checksum.txt", content, { contentMD5: "hahahaha" }))
            .rejects
            .toThrowError(new BlobMismatchedMD5IntegrityError("hahahaha", checksum));
    });

    it("should be able to write a nested file", () => {
        const content = loremIpsum({ count: 512, format: "plain", units: "sentences" });

        const fileStorage = new FileStorage(temporaryDirectory);

        expect(fileStorage.put("nested/path_to/normal-file.txt", content))
            .resolves
            .ok;
    });

    it("should be able to delete non existent file", () => {
        const fileStorage = new FileStorage(temporaryDirectory);

        expect(fileStorage.delete("not-exists.txt"))
            .resolves
            .ok;
    });

    it("should be able to check if a path not exists", () => {
        const fileStorage = new FileStorage(temporaryDirectory);

        expect(fileStorage.exists("not-exists.txt"))
            .resolves
            .toStrictEqual(false);
    });

    it("should return empty iterable for empty directory", () => {
        const fileStorage = new FileStorage(temporaryDirectory);

        expect(fileStorage.list())
            .resolves
            .toHaveLength(0);
    });

    it("should throw an error on copying not existing file", () => {
        const fileStorage = new FileStorage(temporaryDirectory);

        expect(fileStorage.copy("not-exists.txt", "not-exists.rst"))
            .rejects
            .toThrowError(new BlobFileNotExistError("not-exists.txt"));
    });

    it("should throw an error on moving non existing file", () => {
        const fileStorage = new FileStorage(temporaryDirectory);

        expect(fileStorage.move("not-exists.txt", "not-exists.rst"))
            .rejects
            .toThrowError(new BlobFileNotExistError("not-exists.txt"));
    });

    it("should throw an error on getting non existing file", () => {
        const fileStorage = new FileStorage(temporaryDirectory);

        expect(fileStorage.get("not-exists.txt"))
            .rejects
            .toThrowError(new BlobFileNotExistError("not-exists.txt"));
    });

    it("should throw an error on stat non existing file", () => {
        const fileStorage = new FileStorage(temporaryDirectory);

        expect(fileStorage.stat("not-exists.txt"))
            .rejects
            .toThrowError(new BlobFileNotExistError("not-exists.txt"));
    });
});