# Blob

An agnostic driver for managing object storage in Node.js
from [Google Cloud Storage](https://cloud.google.com/storage/), [AWS S3](https://aws.amazon.com/s3/), 
[Azure Blob Storage](https://azure.microsoft.com/en-us/products/storage/blobs/),
or filesystem.

This library works by provides a consistent interface for interacting with different object storage services. The
implementation for each object storage service must adhere to our `IObjectStorage` interface. This means that you can
use the same library to interact with object storage services from different providers, such as Amazon S3, Google Cloud
Storage, and Azure Blob Storage.

## Install

```sh
npm install @teknologi-umum/blob
```

## Usage

### Connection String

You would need to acquire a connection string from your storage provider of choice.

AWS (or any other S3-compatible
storage): `s3://access_key:secret_key@bucket_name?forcePathStyle=true&customUserAgent=your_user_agent&more_config=more_value`

Google Cloud: `gcs://bucket_name`

Azure Blob: `azblob://my_container`

Filesystem: `file:///path/to/directory`

⚠️ Using any other schemes than `s3`, `gcs`, `azblob` or `file` will throw a `TypeError`.

### Methods

* `put(path: string, content: Buffer | string, options?: PutOptions): Promise<void>`: This method is used to upload a
  blob to the object storage service. The `path` parameter specifies the name of the blob to be uploaded. The `content`
  parameter specifies the content of the blob. The `options` parameter is an optional object that can be used to specify
  additional properties of the blob, such as the content type and caching attributes.
* `putStream(path: string, options?: PutOptions): Promise<Writable>`: This method is used to upload a blob to the object
  storage service using a stream. The `path` parameter specifies the name of the blob to be uploaded. The `options`
  parameter is an optional object that can be used to specify additional properties of the blob, such as the content
  type and caching attributes. The method returns a promise that resolves to a writable stream that can be used to write
  the blob's content to the object storage service.
* `get(path: string, encoding?: string): Promise<Buffer>`: This method is used to download a blob from the object
  storage service. The `path` parameter specifies the name of the blob to be downloaded. The `encoding` parameter is an
  optional string that specifies the encoding of the blob's content. If the `encoding` parameter is not specified, the
  default encoding of the blob's content will be used. The method returns a promise that resolves to a buffer containing
  the blob's content.
* `getStream(path: string): Promise<Readable>`: This method is used to download a blob from the object storage service
  using a stream. The `path` parameter specifies the name of the blob to be downloaded. The `method` returns a promise
  that resolves to a readable stream that can be used to read the blob's content from the object storage service.
* `stat(path: string): Promise<StatResponse>`: This method is used to get the metadata for a blob. The `path` parameter
  specifies the name of the blob. The method returns a promise that resolves to an object containing the blob's
  metadata.
* `list(path?: string): Promise<Iterable<string>>`: This method is used to list the blobs in a bucket. The `path`
  parameter is an optional string that specifies the path to the bucket. If the `path` parameter is not specified, the
  root bucket will be listed. The method returns a promise that resolves to an iterable object containing the names of
  the blobs in the bucket.
* `exists(path: string): Promise<boolean>`: This method is used to check if a blob exists. The `path` parameter
  specifies the name of the blob. The method returns a promise that resolves to a boolean value indicating whether or
  not the blob exists.
* `delete(path: string): Promise<void>`: This method is used to delete a blob. The `path` parameter specifies the name
  of the blob to be deleted. The method returns a promise that resolves when the blob has been deleted.
* `copy(sourcePath: string, destinationPath: string): Promise<void>`: This method is used to copy a blob. The `sourcePath`
  parameter specifies the name of the blob to be copied. The `destinationPath` parameter specifies the name of the blob to
  copy the source blob to. The method returns a promise that resolves when the blob has been copied.
* `move(sourcePath: string, destinationPath: string): Promise<void>`: This method is used to move a blob. The `sourcePath`
  parameter specifies the name of the blob to be moved. The `destinationPath` parameter specifies the name of the blob
  to move the source blob to. The method returns a promise that resolves when the blob has been moved.

### Example

```typescript
import { Storage } from "@teknologi-umum/blob";

const storage = new Storage("YOUR CONNECTION STRING");

// Upload a blob
const blobPath = "my-blob";
const blobContent = "This is the content of my blob.";
await storage.put(blobPath, blobContent);

// Download a blob
const downloadedBlobContent = await storage.get(blobPath);

// Get the metadata for a blob
const blobMetadata = await storage.stat(blobPath);

// List the blobs in a bucket
const blobs = await storage.list();

// Check if a blob exists
const blobExists = await storage.exists(blobPath);

// Delete a blob
await storage.delete(blobPath);

// Copy a blob
await storage.copy("my-blob", "my-copy-of-blob");

// Move a blob
await storage.move("my-blob", "my-moved-blob");
```

## Contributing

Welcome and thanks for wanting to contribute to this project!

We are always looking for ways to improve this project, and we appreciate your help. Here are some quick steps on how
you can contribute:

1. Fork the project on GitHub. This will create a copy of the project on your own GitHub account.
2. Clone your fork to your local machine. You can do this by
   following [this tutorial](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository).
3. Make your changes to the code. Please make sure to follow the coding style guide and to add tests for your changes.
4. Run the linter and tests to make sure your changes are valid. You can do this using the following commands:
    ```sh
    npm run lint
    npm run test
    ```
5. Commit your changes with a descriptive commit message. Please make sure to include the following information in your
   commit message:

    - The type of change (e.g., feat, fix, docs, test)
    - A brief description of the change
    - The relevant issue number (if applicable)

   See [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for more information regarding this commit
   format.
6. Push your changes to your fork. You can do this using the following command:
    ```sh
    git push origin <branch-name>
    ```
7. Create a pull request on GitHub. This will allow us to review your changes and merge them into the main project if
   they are approved.

We appreciate your help in making this project better!

In addition to the above, please also make sure to adhere to the [Code of Conduct](./.github/CODE_OF_CONDUCT.md) when
contributing to this project.

Thank you again for wanting to contribute! We look forward to working with you.

## License

```
The MIT License (MIT)

Copyright (c) 2023 Teknologi Umum

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

See [LICENSE](./LICENSE)