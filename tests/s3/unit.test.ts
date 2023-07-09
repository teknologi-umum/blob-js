import { afterEach, beforeAll, describe, it, expect, afterAll } from "vitest";
import { loremIpsum } from "lorem-ipsum";
import { createHash } from "node:crypto";
import { BlobFileNotExistError, BlobMismatchedMD5IntegrityError } from "../../src/errors";
import { S3Client } from "@aws-sdk/client-s3";
import { ConnectionString } from "../../src/connectionString";
import { destroyBucket, removeAllObject, setupBucket } from "./util";
import { S3Storage } from "../../src/s3/s3";

describe("S3 Provider - Unit", () => {
    const s3Host = process.env.S3_HOST ?? "http://localhost:9000";
    const s3Access = process.env.S3_ACCESS ?? "teknologi-umum";
    const s3Secret = process.env.S3_SECRET ?? "very-strong-password";
    const bucketName = "blob-js";
    const s3Client = new S3Client({
        endpoint: s3Host,
        credentials: {
            accessKeyId: s3Access,
            secretAccessKey: s3Secret
        },
        disableHostPrefix: true,
        forcePathStyle: true,
        region: "us-east-1"
        // NOTE: For debugging purpose, uncomment this line below to know
        //       what the SDK is doing. Otherwise, you'd be as confused
        //       as I was.
        // logger: console,
    });

    const connectionStringConfig: ConnectionString = {
        provider: "s3",
        username: s3Access,
        password: s3Secret,
        bucketName: bucketName,
        parameters: {
            endpoint: s3Host,
            disableHostPrefix: "true",
            forcePathStyle: "true"
        }
    };

    beforeAll(async () => {
        // Create S3 bucket
        await setupBucket(s3Client, bucketName);
    });

    afterEach(async () => {
        await removeAllObject(s3Client, bucketName);
    });

    afterAll(async () => {
        await removeAllObject(s3Client, bucketName);
        await destroyBucket(s3Client, bucketName);
    });


    it("should be able to write a normal file", () => {
        const content = loremIpsum({ count: 512, format: "plain", units: "sentences" });

        const s3Storage = new S3Storage(connectionStringConfig);

        expect(s3Storage.put("normal-file.txt", content))
            .resolves
            .ok;
    });

    it("should be able to write a normal file with md5 checksum", () => {
        const content = loremIpsum({ count: 512, format: "plain", units: "sentences" });
        const hashFunc = createHash("md5");
        hashFunc.update(content);
        const checksum = hashFunc.digest("base64");

        const s3Storage = new S3Storage(connectionStringConfig);

        expect(s3Storage.put("md5-checksum.txt", content, { contentMD5: checksum }))
            .resolves
            .ok;
    });

    it("should throw an error for invalid md5 checksum", () => {
        const content = loremIpsum({ count: 512, format: "plain", units: "sentences" });

        const s3Storage = new S3Storage(connectionStringConfig);

        expect(s3Storage.put("invalid-md5-checksum.txt", content, { contentMD5: "1B2M2Y8AsgTpgAmY7PhCfg==" }))
            .rejects
            .toThrowError(new BlobMismatchedMD5IntegrityError("1B2M2Y8AsgTpgAmY7PhCfg==", ""));
    });

    it("should be able to write a nested file", () => {
        const content = loremIpsum({ count: 512, format: "plain", units: "sentences" });

        const s3Storage = new S3Storage(connectionStringConfig);

        expect(s3Storage.put("nested/path_to/normal-file.txt", content))
            .resolves
            .ok;
    });

    it("should be able to delete non existent file", () => {
        const s3Storage = new S3Storage(connectionStringConfig);

        expect(s3Storage.delete("not-exists.txt"))
            .resolves
            .ok;
    });

    it("should be able to check if a path not exists", () => {
        const s3Storage = new S3Storage(connectionStringConfig);

        expect(s3Storage.exists("not-exists.txt"))
            .resolves
            .toStrictEqual(false);
    });

    it("should return empty iterable for empty directory", () => {
        const s3Storage = new S3Storage(connectionStringConfig);

        expect(s3Storage.list())
            .resolves
            .toHaveLength(0);
    });

    it("should throw an error on copying not existing file", () => {
        const s3Storage = new S3Storage(connectionStringConfig);

        expect(s3Storage.copy("not-exists.txt", "not-exists.rst"))
            .rejects
            .toThrowError(new BlobFileNotExistError("not-exists.txt"));
    });

    it("should throw an error on moving non existing file", () => {
        const s3Storage = new S3Storage(connectionStringConfig);

        expect(s3Storage.move("not-exists.txt", "not-exists.rst"))
            .rejects
            .toThrowError(new BlobFileNotExistError("not-exists.txt"));
    });

    it("should throw an error on getting non existing file", () => {
        const s3Storage = new S3Storage(connectionStringConfig);

        expect(s3Storage.get("not-exists.txt"))
            .rejects
            .toThrowError(new BlobFileNotExistError("not-exists.txt"));
    });

    it("should throw an error on stat non existing file", () => {
        const s3Storage = new S3Storage(connectionStringConfig);

        expect(s3Storage.stat("not-exists.txt"))
            .rejects
            .toThrowError(new BlobFileNotExistError("not-exists.txt"));
    });
});