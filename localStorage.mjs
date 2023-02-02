import * as fs from 'fs';

export default class LocalStorage {
    filename = null
    stream = null

    constructor(filename) {
        this.filename = filename
    }

    init() {
        if (this.filename === null || this.filename === '') throw new Error('Missing filename');
        this.stream = fs.createWriteStream(this.filename, { flags: 'w' });
    }

    write(chunk) {
        this.stream.write(chunk);
    }

    end() {
        if (this.stream) this.stream.end();
    }
}