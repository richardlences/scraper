import axios, { AxiosInstance, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { load } from "cheerio";
import { Client } from "pg";
import { readFileSync } from "fs";

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

async function scrapeSite() {
    const file = readFileSync("./unique.txt", "utf-8").split("\n");
    const names = new Set;
    for (const line of file) {
        const products: Product[] = [];
        const baseSite = line;
        const axiosInstance = createAxiosInstance();
        let response = await axiosInstance.get(line);
        let $ = load(response.data);
        let numPages = 1;
        const pagination = $(".pagination");
        if (pagination.length > 0) {
            numPages = Number(pagination.find("li").eq(-2).text());
        }
        for (let i = 0; i < numPages; i++) {
            response = await axiosInstance.get(`${baseSite}?page=${i+1}`);
            $ = load(response.data);
            const productsHTML = $(".product-box--main");
            productsHTML.each(function(i, productHTML) {
                const name = $(productHTML).find("h3").first().text().trim();
                if (names.has(name)) {
                    return;
                }
                const price = $(productHTML).find(".product-box__price-bundle strong").first().text().replace(/\u00a0/g, "").replace(/,/, ".");
                const productType = $(productHTML).find(".product-box__parameters").first().text().split(", ").at(0) || "unknown";
                const product: Product = {
                    Name: name,
                    Price: Number(price.slice(0, -1)),
                    Type: productType.trim()
                }
                products.push(product);
                names.add(name);
            })
        }
        await writeToDB(products)
        console.log("written: "+baseSite)
    }
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
        console.log("Successfully connected to database");
    }  catch(err) {
        console.error("There was an error connecting to database", err);
    }
}

async function writeToDB(products: Product[]) {
    for (const product of products) {
        try {
            await client.query("INSERT INTO products (name, price, type) VALUES ($1, $2, $3) on conflict (name) do nothing", Object.values(product));
        } catch(err) {
            console.error("There was an error writing to the database", err);
        }
    }
}

async function main() {
    await connectToDB();
    await scrapeSite();
    await client.end();
}

main();