import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { destroyBucket, removeAllObject, setupBucket } from "./minio.util";
import { loremIpsum } from "lorem-ipsum";
import { createHash } from "node:crypto";
import { ConnectionString } from "../../src/connectionString";
import { MinioStorage } from "../../src/s3/minio";
import { Client } from "minio";

describe("S3 Provider - Integration", () => {
    const s3Host = process.env.S3_HOST ?? "http://localhost:9000";
    const s3Access = process.env.S3_ACCESS ?? "teknologi-umum";
    const s3Secret = process.env.S3_SECRET ?? "very-strong-password";
    const bucketName = "blob-js";
    const s3Client = new Client({
        endPoint: s3Host,
        accessKey: s3Access,
        secretKey: s3Secret,
        useSSL: false,
        pathStyle: true,
        region: "us-east-1"
    });

    const connectionStringConfig: ConnectionString = {
        provider: "s3",
        username: s3Access,
        password: s3Secret,
        bucketName: bucketName,
        parameters: {
            useMinioSdk: "true",
            endpoint: s3Host,
            disableHostPrefix: "true",
            forcePathStyle: "true"
        }
    };

    beforeAll(async () => {
        // Create S3 bucket
        await setupBucket(s3Client, bucketName);
    });

    afterAll(async () => {
        await removeAllObject(s3Client, bucketName);
        await destroyBucket(s3Client, bucketName);
    });

    it("should be able to create, read and delete file", async () => {
        const content = loremIpsum({count: 1024, units: "sentences"});
        const hashFunc = createHash("md5");
        hashFunc.update(content);
        const checksum = hashFunc.digest("base64");

        const s3Client = new MinioStorage(connectionStringConfig);

        await s3Client.put("lorem-ipsum.txt", content, {contentMD5: checksum});

        expect(s3Client.exists("lorem-ipsum.txt"))
            .resolves
            .toStrictEqual(true);

        // GetObjectAttributes is not available on MinIO
        // const fileStat = await s3Client.stat("lorem-ipsum.txt");
        // expect(fileStat.size).toStrictEqual(content.length);

        const fileContent = await s3Client.get("lorem-ipsum.txt");
        expect(fileContent.toString()).toStrictEqual(content);

        expect(s3Client.delete("lorem-ipsum.txt"))
            .resolves
            .ok;
    });
});