import { Storage } from "@google-cloud/storage";
export default class GCSStorage {
    bucketName = null
    filename = null
    stream = null
    storage = null

    constructor(gcsCredentialFile, bucketName, filename) {
        this.bucketName = bucketName
        this.filename = filename
        this.storage = new Storage({ keyFilename: gcsCredentialFile });
    }

    init() {
        if (this.bucketName === null || this.bucketName === '') throw new Error('Missing bucket name');
        if (this.filename === null || this.filename === '') throw new Error('Missing filename');

        const destBucket = this.storage.bucket(this.bucketName);
        const file = destBucket.file(this.filename);
        this.stream = file.createWriteStream();
    }

    write(chunk) {
        this.stream.write(chunk);
    }

    end() {
        if (this.stream) this.stream.end();
    }
}