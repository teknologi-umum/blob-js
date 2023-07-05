import { Readable, Writable } from "node:stream";

export type StatResponse = {
    /**
     * Size is the size of the blob's content in bytes.
     */
    size: number,
    /**
     * CreatedTime is the time the blob was created.
     */
    createdTime: Date,
    /**
     * LastModified is the time the blob was last modified.
     */
    lastModified: Date,
    /**
     * ContentType specifies the MIME type of the blob being written. If not set,
     * it will be inferred from the content using the algorithm described at
     * @see http://mimesniff.spec.whatwg.org/.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type
     */
    contentType?: string,
    /**
     * ContentEncoding specifies the encoding used for the blob's content, if any.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding
     */
    contentEncoding?: string,
    /**
     * ContentLanguage specifies the language used in the blob's content, if any.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Language
     */
    contentLanguage?: string,
    /**
     * ContentDisposition specifies whether the blob content is expected to be
     * displayed inline or as an attachment.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
     */
    contentDisposition?: string,
    /**
     * CacheControl specifies caching attributes that services may use
     * when serving the blob.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
     */
    cacheControl?: string,
    /**
     * MD5 is an MD5 hash of the blob contents or undefined if not available.
     */
    md5?: string,
    /**
     * ETag for the blob
     * @see https://en.wikipedia.org/wiki/HTTP_ETag
     */
    etag?: string,
    /**
     * Metadata holds key/value pairs associated with the blob.
     * Keys are guaranteed to be in lowercase, even if the backend service
     * has case-sensitive keys (although note that Metadata written via
     * this library will always be lowercased). If there are duplicate
     * case-insensitive keys (e.g., "foo" and "FOO"), only one value
     * will be kept, and it is undefined which one.
     */
    metadata?: Record<string, string>
}

export type PutOptions = {
    /**
     * CacheControl specifies caching attributes that services may use
     * when serving the blob.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
     */
    cacheControl?: string,
    /**
     * ContentDisposition specifies whether the blob content is expected to be
     * displayed inline or as an attachment.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
     */
    contentDisposition?: string,
    /**
     * ContentEncoding specifies the encoding used for the blob's content, if any.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding
     */
    contentEncoding?: string,
    /**
     * ContentLanguage specifies the language used in the blob's content, if any.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Language
     */
    contentLanguage?: string,
    /**
     * ContentLanguage specifies the language used in the blob's content, if any.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Language
     */
    contentType?: string,
    /**
     * ContentMD5 is used as a message integrity check.
     * If not undefined, the MD5 hash of the bytes written must match
     * contentMD5, or will return an error without completing the write.
     * @see https://tools.ietf.org/html/rfc1864
     */
    contentMD5?: string,
    /**
     * Metadata holds key/value pairs associated with the blob.
     * Keys are guaranteed to be in lowercase, even if the backend service
     * has case-sensitive keys (although note that Metadata written via
     * this library will always be lowercased). If there are duplicate
     * case-insensitive keys (e.g., "foo" and "FOO"), only one value
     * will be kept, and it is undefined which one.
     */
    metadata?: Record<string, string>
}

export interface IObjectStorage {
    put(path: string, content: Buffer | string, options?: PutOptions): Promise<void>

    putStream(path: string, options?: PutOptions): Promise<Writable>;

    get(path: string, encoding?: string): Promise<Buffer>

    getStream(path: string): Promise<Readable>

    stat(path: string): Promise<StatResponse>

    list(path?: string): Promise<Iterable<string>>

    exists(path: string): Promise<boolean>

    delete(path: string): Promise<void>

    copy(sourcePath: string, destinationPath: string): Promise<void>

    move(sourcePath: string, destinationPath: string): Promise<void>
}