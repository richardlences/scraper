import axios from "axios";
import { load } from "cheerio";
import { readFileSync, appendFile, writeFile } from "fs";

async function findURLs() {
    const file = readFileSync("unique.txt", "utf-8").split("\n");
    for (const line of file) {
        const $ = load((await axios.get(line)).data);
        const pagination = $(".pagination");
        let numPages;
        if (pagination.length > 0) {
            numPages = Number(pagination.find("li").eq(-2).text());
        } else {
            numPages = 1;
        }
        for (let j = 0; j < numPages; j++) {
            appendFile("urlsWithPage.txt", `${line}?page=${j + 1}\n`, "utf-8", (err) => console.log(err));
        }
    }
    writeFile("urlsWithPage.txt", readFileSync("urlsWithPage.txt", "utf-8").split("\n").slice(0, -1).join("\n"), "utf-8", (err) => console.log(err));
}
findURLs();