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
    const data = [];

    let nextPage = null;
    let n = 0;
    do {
        console.log(`Requesting page ${++n} ${nextPage ? `with cursor ${nextPage} ` : ``}`);
        const query = nextPage ? { ...params, pageCursor: nextPage } : params;
        const result = await apiInstance.listLogsGet(query);
        data.push(...result.data);
        nextPage = result?.meta?.page?.after;
        console.log(`${result.data.length} results (${data.length} total)`);
    } while (nextPage);

    return data;
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
    process.exit();
}

console.log(chalk.cyan("Downloading logs:\n" + JSON.stringify(initialParams, null, 2) + "\n"));

(async function () {
    let data;
    try {
        data = await getLogs(apiInstance, initialParams);
    } catch (e) {
        console.log(chalk.red(e.message));
        process.exit(1);
    }

    const outputFile = argv.output ?? "results.json";
    console.log(chalk.cyan(`\nWriting ${data.length} logs to ${outputFile}`));
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));

    console.log(chalk.green("Done!"));
})();
