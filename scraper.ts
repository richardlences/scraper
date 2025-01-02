import axios, { AxiosInstance, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { load } from "cheerio";
import { Client } from "pg";
import { readFileSync, appendFile } from "fs";
import { spawn } from 'child_process';
import { json } from 'stream/consumers';

type Product = {
    Name: String,
    Price: Number,
    Type: String,
}

function createAxiosInstance() {
    const instance = axios.create({
        // baseURL: 'https://www.nay.sk', // Set base URL
        timeout: 30000, // Set timeout (optional)
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
            Accept: 'text/html',
        },
    });
    axiosRetry(instance, {
        retries: 3, // Number of retry attempts
        retryDelay: axiosRetry.exponentialDelay, // Delay between retries (exponential backoff)
        retryCondition: (error) => {
            // Retry only on network or server errors (not client errors)
            return axiosRetry.isNetworkOrIdempotentRequestError(error);
        },
    });

    return instance;
};

async function scrapeSite(num: number) {
    const products: Product[] = [];
    const axiosInstance = createAxiosInstance();
    const file = readFileSync("urlsWithPage.txt", "utf-8").split("\n");
    for (let i = num; i < file.length; i += threads) {
        try {
        const site = file[i];
        const response = await axiosInstance.get(site);
        const $ = load(response.data);
        const productsHTML = $(".product-box--main");
        productsHTML.each(function (i, productHTML) {
            const name = $(productHTML).find("h3").first().text().trim();
            const price = $(productHTML).find(".product-box__price-bundle strong").first().text().replace(/\u00a0/g, "").replace(/,/, ".");
            const productType = $(productHTML).find(".product-box__parameters").first().text().split(", ").at(0) || "unknown";
            const product: Product = {
                Name: name,
                Price: Number(price.slice(0, -1)),
                Type: productType.trim()
            }
            products.push(product);
        })
        console.log(i);
        } catch(err) {
            console.error("error", err);
        }
    }
    await writeToDB(products)
}

const client = new Client({
    user: "scraper",
    password: "heslo123",
    port: 5432,
    host: "localhost",
    database: "scrapedData"
});

async function connectToDB() {
    try {
        await client.connect();
        console.log(JSON.stringify("Successfully connected to database"));
    } catch (err) {
        console.error("There was an error connecting to database", err);
    }
}

async function writeToDB(products: Product[]) {
    for (const product of products) {
        try {
            await client.query("INSERT INTO products (name, price, type) VALUES ($1, $2, $3) on conflict (name) do nothing", Object.values(product));
        } catch (err) {
            console.error("There was an error writing to the database", err);
        }
    }
}
const threads = 150;
async function main() {
    console.error(JSON.stringify("zacatek"));
    const thread = process.argv[2];
    if (!thread) {
        // pusti vsetky
        for (let i = 0; i < threads; i++) {
            const child = spawn("node", ["scraper.js", i.toString()]);
            child.stdout.on('data', function(data) {
                console.log(JSON.parse(data));
            });
            child.stderr.on('data', function(error) {
                console.error(error);
            });
        }
    } else {
        // pust jedn
        await connectToDB();
        await scrapeSite(Number(thread));
        await client.end();
    }
}

main();