#!/usr/bin/env node

import { v2 } from "@datadog/datadog-api-client";
import chalk from "chalk";
import * as dotenv from "dotenv";
import yargs from "yargs";
import GCSStorage from "./gcsStorage.mjs";
import LocalStorage from "./localStorage.mjs";

const argv = yargs(process.argv).argv;

dotenv.config();

const configuration = v2.createConfiguration();
const apiInstance = new v2.LogsApi(configuration);

async function getLogs(apiInstance, storageClass, params) {
    let nextPage = null;
    let total = 0
    let n = 0;

    storageClass.write('[');

    do {
        console.log(`Requesting page ${n + 1} ${nextPage ? `with cursor ${nextPage} ` : ``}`);
        const query = nextPage ? { ...params, pageCursor: nextPage } : params;
        const result = await apiInstance.listLogsGet(query);
        if (n >= 1 && result.data.length > 0) storageClass.write(',')
        for (const [logLine, logItem] of result.data.entries()) {
            storageClass.write((logLine >= 1 ? ',' : '') + JSON.stringify(logItem))
        }
        total += result.data.length
        nextPage = result?.meta?.page?.after;
        n++
        console.log(`${result.data.length} results (${total} total)`);
    } while (nextPage);

    storageClass.write(']');
}

function oneYearAgo() {
    return new Date(new Date().setFullYear(new Date().getFullYear() - 1));
}

const initialParams = {
    filterQuery: argv.query,
    filterIndex: argv.index ?? "main",
    filterFrom: argv.from ? new Date(argv.from) : oneYearAgo(),
    filterTo: argv.to ? new Date(argv.to) : new Date(),
    pageLimit: argv.pageSize ? Math.min(argv.pageSize, 5000) : 1000,
};

if (!initialParams.filterQuery) {
    console.log(chalk.red("Error: No query supplied, use --query"));
    process.exit(1);
}

let storage = null
let filename = argv.output ? argv.output : `${initialParams.filterFrom.toJSON().slice(0, 19).replaceAll(':', '_')}-${initialParams.filterTo.toJSON().slice(0, 19).replaceAll(':', '_')}.json`

if (argv.storage == 'gcs') {
    const gcsCredentialFile = argv.gcsCredentialFile
    const gcsBucketName = argv.gcsBucketName

    if (!gcsBucketName) {
        console.log(chalk.red("Error: No bucket name supplied, use --gcs-bucket-name"));
        process.exit(1);
    }

    if (!gcsCredentialFile) {
        console.log(chalk.red("Error: No gcs credential file supplied, use --gcs-credential-file"));
        process.exit(1);
    }

    storage = new GCSStorage(gcsCredentialFile, gcsBucketName, filename)
} else {
    storage = new LocalStorage(filename)
}

console.log(chalk.cyan("Downloading logs:\n" + JSON.stringify(initialParams, null, 2) + "\n"));

(async function () {
    try {
        storage.init()
        try {
            await getLogs(apiInstance, storage, initialParams);
        } finally {
            storage.end()
        }
    } catch (e) {
        console.log(chalk.red(e.message));
        process.exit(1);
    }

    console.log(chalk.green("Done!"));
})();
