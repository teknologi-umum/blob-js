import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { destroyBucket, removeAllObject, setupBucket } from "./aws.util";
import { S3Client } from "@aws-sdk/client-s3";
import { loremIpsum } from "lorem-ipsum";
import { createHash } from "node:crypto";
import { S3Storage } from "../../src/s3/s3";
import { ConnectionString } from "../../src/connectionString";

describe("S3 Provider - Integration", () => {
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

    afterAll(async () => {
        await removeAllObject(s3Client, bucketName);
        await destroyBucket(s3Client, bucketName);
    });

    it("should be able to create, read and delete file", async () => {
        const content = loremIpsum({count: 1024, units: "sentences"});
        const hashFunc = createHash("md5");
        hashFunc.update(content);
        const checksum = hashFunc.digest("base64");

        const s3Client = new S3Storage(connectionStringConfig);

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