import { URL } from "node:url";

export type ConnectionString = {
    provider: "file" | "s3" | "gcs" | "azblob",
    bucketName: string,
    parameters?: Record<string, string>,
    username?: string,
    password?: string
}

/**
 * Parses connection string for some object storage provider.
 * @param str Connection string
 * @throws TypeError For invalid provider
 */
export function parseConnectionString(str: string): ConnectionString {
    const parsedUrl = new URL(str);

    const provider = parsedUrl.protocol.slice(0, parsedUrl.protocol.length - 1);
    if (provider !== "file" && provider !== "s3" && provider !== "gcs" && provider !== "azblob") {
        throw new TypeError("expecting provider to be one of 'file', 's3', 'gcs', or 'azblob'");
    }

    let parameters: Record<string, string> | undefined;

    for (const [key, value] of parsedUrl.searchParams) {
        if (parameters === undefined) {
            parameters = {};
        }

        parameters[ key ] = value;
    }

    return {
        provider: provider,
        bucketName: parsedUrl.host + parsedUrl.pathname,
        parameters: parameters,
        username: parsedUrl.username !== "" ? parsedUrl.username : undefined,
        password: parsedUrl.password !== "" ? parsedUrl.password : undefined
    };
}