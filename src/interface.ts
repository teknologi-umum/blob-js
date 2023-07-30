import { Readable, Writable } from "node:stream";

/**
 * The StatResponse type defines the response object that is returned by the stat() method
 * of the IObjectStorage interface.
 */
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

/**
 * The PutOptions type defines the options that can be passed to the put() method
 * of the IObjectStorage interface.
 */
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

/**
 * This interface defines a set of methods for interacting with an object storage service.
 * These methods allow you to upload, download, list, and manage blobs.
 */
export interface IObjectStorage {
    /**
     * Upload a blob to the object storage service
     * @param path Name of the blob to be uploaded
     * @param content Content of the blob
     * @param options Optional object that can be used to specify additional properties of the blob,
     * such as the content type and caching attributes.
     * @throws BlobMismatchedMD5IntegrityError The uploaded content's hash does not match
     * options.contentMD5 value.
     */
    put(path: string, content: Buffer | string, options?: PutOptions): Promise<void>

    /**
     * Upload a blob to the object storage service using a stream
     * @param path Name of the blob to be uploaded
     * @param options Optional object that can be used to specify additional properties of the blob,
     * such as the content type and caching attributes
     */
    putStream(path: string, options?: PutOptions): Promise<Writable>;

    /**
     * Download a blob from the object storage service
     * @param path Name of the blob to be downloaded
     * @param encoding Optional string that specifies the encoding of the blob's content.
     * If the encoding parameter is not specified, the default encoding of the blob's content will be used.
     * @throws BlobFileNotExistError Specified blob does not exist
     * @throws BlobFilePermissionDeniedError Encountered a permission denied error during opening the file
     */
    get(path: string, encoding?: string): Promise<Buffer>

    /**
     * Download a blob from the object storage service using a stream
     * @param path Name of the blob to be downloaded
     */
    getStream(path: string): Promise<Readable>

    /**
     * Get the metadata for a blob
     * @param path Name of the blob
     * @throws BlobFileNotExistError Specified blob does not exist
     */
    stat(path: string): Promise<StatResponse>

    /**
     * List the blobs in a bucket
     * @param path Optional string that specifies the path to the bucket.
     * If the path parameter is not specified, the root bucket will be listed.
     */
    list(path?: string): Promise<Iterable<string>>

    /**
     * Check if a blob exists
     * @param path Name of the blob
     */
    exists(path: string): Promise<boolean>

    /**
     * Delete a blob
     * @param path Name of the blob to be deleted
     */
    delete(path: string): Promise<void>

    /**
     * Copy a blob
     * @param sourcePath The name of the blob to be copied
     * @param destinationPath Name of the blob to copy the source blob to
     * @throws BlobFileNotExistError Specified blob does not exist
     */
    copy(sourcePath: string, destinationPath: string): Promise<void>

    /**
     * Move a blob
     * @param sourcePath Name of the blob to be moved
     * @param destinationPath Name of the blob to move the source blob to
     * @throws BlobFileNotExistError Specified blob does not exist
     */
    move(sourcePath: string, destinationPath: string): Promise<void>
}