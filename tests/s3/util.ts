import {
    BucketAlreadyExists,
    BucketAlreadyOwnedByYou,
    CreateBucketCommand,
    DeleteBucketCommand,
    DeleteObjectsCommand,
    ListObjectsV2Command,
    S3Client
} from "@aws-sdk/client-s3";

export async function setupBucket(client: S3Client, bucketName: string): Promise<void> {
    try {
        const command = new CreateBucketCommand({
            Bucket: bucketName
        });

        await client.send(command);
    } catch (error: unknown) {
        if (error instanceof BucketAlreadyOwnedByYou || error instanceof BucketAlreadyExists) {
            return;
        }

        throw error;
    }
}

export async function removeAllObject(client: S3Client, bucketName: string): Promise<void> {
    const listObjCommand = new ListObjectsV2Command({
        Bucket: bucketName
    });

    const listObjResponse = await client.send(listObjCommand);

    const objectKeys: {Key: string}[] = [];

    if (listObjResponse.Contents !== undefined) {
        for (const object of listObjResponse.Contents) {
            if (object.Key !== undefined) {
                objectKeys.push({Key: object.Key});
            }
        }
    }

    if (objectKeys.length === 0) {
        return;
    }

    const deleteObjectsCommand = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
            Objects: objectKeys
        }
    });

    await client.send(deleteObjectsCommand);
}

export async function destroyBucket(client: S3Client, bucketName: string): Promise<void> {
    const command = new DeleteBucketCommand({
        Bucket: bucketName
    });

    await client.send(command);
}