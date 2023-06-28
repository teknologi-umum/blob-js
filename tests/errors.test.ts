import { describe, expect, it } from "vitest";
import { BlobMismatchedMD5Integrity } from "../src/errors";

describe("BlobMismatchedMD5Integrity", () => {
    it("should return correct parameters", () => {
        const error = new BlobMismatchedMD5Integrity("AABC", "ACCBD");

        expect(error).instanceof(BlobMismatchedMD5Integrity);
        expect(error).instanceof(Error);
        expect(error.message).toStrictEqual("Mismatched MD5 integrity check. Expecting AABC while acquired ACCBD");
        expect(error.name).toStrictEqual("BlobMismatchedMD5Integrity");
        expect(error.expecting).toStrictEqual("AABC");
        expect(error.acquired).toStrictEqual("ACCBD");
    });
});