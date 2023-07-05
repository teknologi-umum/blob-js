export class BlobMismatchedMD5IntegrityError extends Error {
    constructor(public readonly expecting: string, public readonly acquired: string) {
        super(`Mismatched MD5 integrity check. Expecting ${expecting} while acquired ${acquired}`);
        this.name = "BlobMismatchedMD5IntegrityError";
    }
}

export class BlobFileNotExistError extends Error {
    constructor(public readonly path: string) {
        super(`File not exists: ${path}`);
        this.name = "BlobFileNotExistError";
    }
}

export class BlobFilePermissionDeniedError extends Error {
    constructor(public readonly path: string) {
        super(`Permission denied: ${path}`);
        this.name = "BlobFilePermissionDeniedError";
    }
}