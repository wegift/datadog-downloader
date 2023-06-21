# DataDog log downloader

Download logs from DataDog via the API.
This allows you to download a large number of logs matching a particular query rather than being bound by the 5000 limit imposed on the export button in the UI.
Logs are output as a JSON file.

## Usage

```
DD_API_KEY=... DD_APP_KEY=... npx github:wegift/datadog-downloader --query '"Redeem failed"'
```

## Authentication

You will need an API key and an app key to access the DataDog api.
These should be provided in environment variables as seen above.

API keys are global for a DataDog account and can be found in organization settings.
App keys are personal to your profile and can be generated in personal settings.

## Options

```
--query     The filter query (aka search term). Take care when quoting on the command line, single quote the entire query for best results.

--index     Which index to read from, default 'main'

--from      Start date/time defaults to 1y ago
--to        End date/time, omit for results up to the current time

--pageSize  How many results to download at a time, default 1000 limit of 5000

--output    Path of json file to write results to, default 'results.json'

--format
    json (default): Save the final output as a single JSON object
    ndjson: Stream the output to New Line Delimited JSON file (Less memory intensive on larger datasets)
```

Note: Date/times are parsed by JS `Date` constructor, e.g. 2022-01-01

## Local Dev

Run `npm install`.

Copy `.env.example` to `.env` and add a valid DataDog API key and app key.

### Run

```
node index.mjs --query '"Redeem token failure" -@redeem_failure_reason:"Invalid token"'
```

## Caveats

Logs are not streamed, they are all stored in memory and stringified / written as as single action.
I have tested with 25k logs and there were no issues, the resultant JSON file was only 100mb so it seems likely that
you could download 100k+ without running into memory or performance limits but ymmv.


## Contributing

**Pull requests welcome!**
