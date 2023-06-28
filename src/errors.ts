export class BlobMismatchedMD5Integrity extends Error {
    constructor(public readonly expecting: string, public readonly acquired: string) {
        super(`Mismatched MD5 integrity check. Expecting ${expecting} while acquired ${acquired}`);
        this.name = "BlobMismatchedMD5Integrity";
    }
}