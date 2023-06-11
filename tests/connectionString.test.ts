import { describe, expect, it } from "vitest";
import { parseConnectionString } from "../src/connectionString";

describe("parseConnectionString", () => {
    it("should parse S3 connection string", () => {
        const connectionString = parseConnectionString("s3://accesskey:secretkey@my-bucket?region=us-west-1&awssdk=2&endpoint=minio.selfhosted.com&s3ForcePathStyle=false&disableSSL=true")
        expect(connectionString.bucketName).toStrictEqual("my-bucket");
        expect(connectionString.provider).toStrictEqual("s3");
        expect(connectionString.password).toStrictEqual("secretkey");
        expect(connectionString.username).toStrictEqual("accesskey");
        expect(connectionString.parameters).not.toBeUndefined();
        expect(connectionString.parameters?.[ "region" ]).toStrictEqual("us-west-1");
        expect(connectionString.parameters?.[ "awssdk" ]).toStrictEqual("2");
        expect(connectionString.parameters?.[ "endpoint" ]).toStrictEqual("minio.selfhosted.com");
        expect(connectionString.parameters?.[ "s3ForcePathStyle" ]).toStrictEqual("false");
        expect(connectionString.parameters?.[ "disableSSL" ]).toStrictEqual("true");
    });

    it("should parse GCS connection string", () => {
        const connectionString = parseConnectionString("gcs://my-bucket");
        expect(connectionString.provider).toStrictEqual("gcs");
        expect(connectionString.bucketName).toStrictEqual("my-bucket");
        expect(connectionString.password).toBeUndefined();
        expect(connectionString.username).toBeUndefined();
        expect(connectionString.parameters).toBeUndefined();
    });

    it("should parse Azure Blob connection string", () => {
        const connectionString = parseConnectionString("azblob://my-container?protocol=http&domain=localhost:10001&localemu=false&cdn=false");
        expect(connectionString.provider).toStrictEqual("azblob");
        expect(connectionString.bucketName).toStrictEqual("my-container");
        expect(connectionString.password).toBeUndefined();
        expect(connectionString.username).toBeUndefined();
        expect(connectionString.parameters).not.toBeUndefined();
        expect(connectionString.parameters?.[ "protocol" ]).toStrictEqual("http");
        expect(connectionString.parameters?.[ "domain" ]).toStrictEqual("localhost:10001");
        expect(connectionString.parameters?.[ "localemu" ]).toStrictEqual("false");
        expect(connectionString.parameters?.[ "cdn" ]).toStrictEqual("false");
    });

    it("should parse filesystem connection string", () => {
        const connectionString = parseConnectionString("file:///var/lib/blob-js");
        expect(connectionString.provider).toStrictEqual("file");
        expect(connectionString.bucketName).toStrictEqual("/var/lib/blob-js");
    });

    it("should throw TypeError for invalid provider", () => {
        expect(() => parseConnectionString("https://my-bucket"))
            .toThrowError(new TypeError("expecting provider to be one of 'file', 's3', 'gcs', or 'azblob'"));
    });
});