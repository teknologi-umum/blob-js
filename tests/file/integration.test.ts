import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join, normalize } from "node:path";
import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { loremIpsum } from "lorem-ipsum";
import { FileStorage } from "../../src/file/file";
import { createHash } from "node:crypto";

describe("File Provider - Integration", () => {
    let temporaryDirectory: string;

    beforeAll(async () => {
        temporaryDirectory = await mkdtemp(join(realpathSync(tmpdir()), "blob-js"));
    });

    afterEach(async () => {
        await rm(temporaryDirectory, { force: true, recursive: true });
        await mkdir(temporaryDirectory, { recursive: true });
    });

    afterAll(async () => {
        await rm(temporaryDirectory, { force: true, recursive: true });
    });

    it("should be able to create, read, and delete file", async () => {
        const content = loremIpsum({ count: 1024, units: "sentences" });
        const hashFunc = createHash("md5");
        hashFunc.update(content);
        const checksum = hashFunc.digest("base64");

        const fileStorage = new FileStorage(temporaryDirectory);

        await fileStorage.put("lorem-ipsum.txt", content, { contentMD5: checksum });

        expect(fileStorage.exists("lorem-ipsum.txt"))
            .resolves
            .toStrictEqual(true);

        const fileStat = await fileStorage.stat("lorem-ipsum.txt");
        expect(fileStat.size).toStrictEqual(content.length);

        const fileContent = await fileStorage.get("lorem-ipsum.txt")
        expect(fileContent.toString()).toStrictEqual(content);

        expect(fileStorage.delete("lorem-ipsum.txt"))
            .resolves
            .ok;
    });

    it("should be able to list many files", async () => {
        const fileStorage = new FileStorage(temporaryDirectory);
        const totalFiles = 20;
        const tasks: Promise<void>[] = []
        for (let i = 1; i <= totalFiles; i++) {
           const content = loremIpsum();
           tasks.push(fileStorage.put(`lorem${i}.txt`, content));
        }

        await Promise.all(tasks);

        const directoryEntries = await fileStorage.list();

        let count = 0;
        for (const entry of directoryEntries) {
            expect(entry).toMatch(/lorem[0-9]{1,2}\.txt/);
            count += 1;
        }

        expect(count).toStrictEqual(totalFiles);
    });

    it("should be able to list files with nested path", async () => {
        const fileStorage = new FileStorage(temporaryDirectory);
        const paths = new Set<string>();
        const totalFiles = 20;
        const tasks: Promise<void>[] = []
        for (let i = 1; i <= totalFiles; i++) {
            const content = loremIpsum();
            let filePath: string;
            if (i % 3 === 0) {
                filePath = `${loremIpsum({count: 1, units: "word"})}/${loremIpsum({count: 1, units: "word"})}/${loremIpsum({count: 1, units: "word"})}.txt`;
            } else if (i % 2 == 0) {
                filePath = `${loremIpsum({count: 1, units: "word"})}/${loremIpsum({count: 1, units: "word"})}.txt`;
            } else {
                filePath = `${loremIpsum({count: 1, units: "word"})}.txt`;
            }

            paths.add(normalize(filePath));
            tasks.push(fileStorage.put(filePath, content));
        }

        await Promise.all(tasks);

        const directoryEntries = await fileStorage.list();

        let count = 0;
        for (const entry of directoryEntries) {
            expect(paths.has(entry)).toBeTruthy();
            count += 1;
        }

        expect(count).toStrictEqual(totalFiles);
    })
})