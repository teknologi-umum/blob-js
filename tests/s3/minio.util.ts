import {
    BucketAlreadyExists,
    BucketAlreadyOwnedByYou,
    CreateBucketCommand,
    DeleteBucketCommand,
    DeleteObjectsCommand,
    ListObjectsV2Command,
    S3Client
} from "@aws-sdk/client-s3";
import { Client } from "minio";

export async function setupBucket(client: Client, bucketName: string): Promise<void> {
    await client.makeBucket(bucketName);
}

export async function removeAllObject(client: Client, bucketName: string): Promise<void> {
    const listObj = client.listObjectsV2(bucketName);

    return new Promise((resolve, reject) => {
        listObj.on("data", async (obj) => {
            if (obj.name !== undefined) {
                await client.removeObject(bucketName, obj.name);
            }
        });
    
        listObj.on("error", (error) => {
            reject(error);
        });
    
        listObj.on("end", () => {
            resolve();
        });
    });
}

export async function destroyBucket(client: Client, bucketName: string): Promise<void> {
    await client.removeBucket(bucketName);
}