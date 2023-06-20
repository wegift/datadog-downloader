#!/usr/bin/env node

import { v2 } from "@datadog/datadog-api-client";
import chalk from "chalk";
import * as dotenv from "dotenv";
import * as fs from "fs";
import yargs from "yargs";

const argv = yargs(process.argv).argv;

dotenv.config();

const configuration = v2.createConfiguration();
const apiInstance = new v2.LogsApi(configuration);

async function getLogs(apiInstance, params) {
    let nextPage = null;
    let n = 0;
    do {
        console.log(`Requesting page ${++n} ${nextPage ? `with cursor ${nextPage} ` : ``}`);
        const query = nextPage ? { ...params, pageCursor: nextPage } : params;
        const result = await apiInstance.listLogsGet(query);
        result.data.forEach((row) => processLog(params.format, row));
        nextPage = result?.meta?.page?.after;
        console.log(`${result.data.length} results (${data.length} total)`);
    } while (nextPage);

    return true;
}

const data = [];
let writer = null;
async function processLog(format, row) {
    switch (format) {
        case "json":
            data.push(row);
            break;
        case "ndjson":
            if (writer === null) {
                writer = fs.createWriteStream(argv.output ?? 'results.json', {flags: 'w'});
            }
            writer.write(JSON.stringify(row, null) + '\n');  
            break;
        default:
            console.log(chalk.red(`Unknown format ${format}`));
            process.exit(1);
    }
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
    format: argv.format ?? "json",
};

if (!initialParams.filterQuery) {
    console.log(chalk.red("Error: No query supplied, use --query"));
    process.exit();
}

console.log(chalk.cyan("Downloading logs:\n" + JSON.stringify(initialParams, null, 2) + "\n"));

(async function () {
    try {
        await getLogs(apiInstance, initialParams);
    } catch (e) {
        console.log(chalk.red(e.message));
        process.exit(1);
    }
    switch (initialParams.format) {
        case "ndjson":
            writer.end();
            break;
        case "json":
            const outputFile = argv.output ?? "results.json";
            console.log(chalk.cyan(`\nWriting ${data.length} logs to ${outputFile}`));
            fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
            break;
    }

    console.log(chalk.green("Done!"));
})();
