/**
 * The BlobMismatchedMD5IntegrityError class represents an error that occurs when
 * the MD5 hash of a blob does not match the expected hash
 */
export class BlobMismatchedMD5IntegrityError extends Error {
    /**
     * @param expecting The expected MD5 hash of the blob.
     * @param acquired The MD5 hash of the blob that was actually acquired.
     */
    constructor(public readonly expecting: string, public readonly acquired: string) {
        super(`Mismatched MD5 integrity check. Expecting ${expecting} while acquired ${acquired}`);
        this.name = "BlobMismatchedMD5IntegrityError";
    }
}

/**
 * The BlobFileNotExistError class represents an error that occurs when the file
 * that is being accessed does not exist.
 */
export class BlobFileNotExistError extends Error {
    /**
     * @param path The path of the file that does not exist.
     */
    constructor(public readonly path: string) {
        super(`File not exists: ${path}`);
        this.name = "BlobFileNotExistError";
    }
}

/**
 * The BlobFilePermissionDeniedError class represents an error that occurs when
 * the user does not have permission to access the file that is being accessed.
 */
export class BlobFilePermissionDeniedError extends Error {
    /**
     * @param path The path of the file that the user does not have permission to access.
     */
    constructor(public readonly path: string) {
        super(`Permission denied: ${path}`);
        this.name = "BlobFilePermissionDeniedError";
    }
}