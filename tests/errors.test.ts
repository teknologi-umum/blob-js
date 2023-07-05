import { describe, expect, it } from "vitest";
import { BlobMismatchedMD5IntegrityError } from "../src/errors";

describe("BlobMismatchedMD5IntegrityError", () => {
    it("should return correct parameters", () => {
        const error = new BlobMismatchedMD5IntegrityError("AABC", "ACCBD");

        expect(error).instanceof(BlobMismatchedMD5IntegrityError);
        expect(error).instanceof(Error);
        expect(error.message).toStrictEqual("Mismatched MD5 integrity check. Expecting AABC while acquired ACCBD");
        expect(error.name).toStrictEqual("BlobMismatchedMD5IntegrityError");
        expect(error.expecting).toStrictEqual("AABC");
        expect(error.acquired).toStrictEqual("ACCBD");
    });
});