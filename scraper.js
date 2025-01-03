"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var axios_retry_1 = require("axios-retry");
var cheerio_1 = require("cheerio");
var pg_1 = require("pg");
var fs_1 = require("fs");
var child_process_1 = require("child_process");
function createAxiosInstance() {
    var instance = axios_1.default.create({
        // baseURL: 'https://www.nay.sk', // Set base URL
        timeout: 30000, // Set timeout (optional)
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
            Accept: 'text/html',
        },
    });
    (0, axios_retry_1.default)(instance, {
        retries: 3, // Number of retry attempts
        retryDelay: axios_retry_1.default.exponentialDelay, // Delay between retries (exponential backoff)
        retryCondition: function (error) {
            // Retry only on network or server errors (not client errors)
            return axios_retry_1.default.isNetworkOrIdempotentRequestError(error);
        },
    });
    return instance;
}
;
function scrapeSite(num) {
    return __awaiter(this, void 0, void 0, function () {
        var products, axiosInstance, file, _loop_1, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    products = [];
                    axiosInstance = createAxiosInstance();
                    file = (0, fs_1.readFileSync)("urlsWithPage.txt", "utf-8").split("\n");
                    _loop_1 = function (i) {
                        var site, response, $_1, productsHTML, err_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 3]);
                                    site = file[i];
                                    return [4 /*yield*/, axiosInstance.get(site)];
                                case 1:
                                    response = _b.sent();
                                    $_1 = (0, cheerio_1.load)(response.data);
                                    productsHTML = $_1(".product-box--main");
                                    productsHTML.each(function (i, productHTML) {
                                        var name = $_1(productHTML).find("h3").first().text().trim();
                                        var price = $_1(productHTML).find(".product-box__price-bundle strong").first().text().replace(/\u00a0/g, "").replace(/,/, ".");
                                        var productType = $_1(productHTML).find(".product-box__parameters").first().text().split(", ").at(0) || "unknown";
                                        var product = {
                                            Name: name,
                                            Price: Number(price.slice(0, -1)),
                                            Type: productType.trim()
                                        };
                                        products.push(product);
                                    });
                                    console.log(i);
                                    return [3 /*break*/, 3];
                                case 2:
                                    err_1 = _b.sent();
                                    console.error("error", err_1);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    };
                    i = num;
                    _a.label = 1;
                case 1:
                    if (!(i < file.length)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(i)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i += threads;
                    return [3 /*break*/, 1];
                case 4: return [4 /*yield*/, writeToDB(products)];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var client = new pg_1.Client({
    user: "scraper",
    password: "heslo123",
    port: 5432,
    host: "localhost",
    database: "scrapedData"
});
function connectToDB() {
    return __awaiter(this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, client.connect()];
                case 1:
                    _a.sent();
                    console.log(JSON.stringify("Successfully connected to database"));
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    console.error("There was an error connecting to database", err_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function writeToDB(products) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, products_1, product, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, products_1 = products;
                    _a.label = 1;
                case 1:
                    if (!(_i < products_1.length)) return [3 /*break*/, 6];
                    product = products_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, client.query("INSERT INTO products (name, price, type) VALUES ($1, $2, $3) on conflict (name) do nothing", Object.values(product))];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_3 = _a.sent();
                    console.error("There was an error writing to the database", err_3);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
var threads = 150;
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var thread, _loop_2, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.error(JSON.stringify("zacatek"));
                    thread = process.argv[2];
                    if (!!thread) return [3 /*break*/, 1];
                    _loop_2 = function (i) {
                        var child = (0, child_process_1.spawn)("node", ["scraper.js", i.toString()]);
                        var arr = [];
                        child.stdout.on('data', function (data) {
                            console.log(JSON.parse(data));
                        });
                        child.stderr.on('data', function (error) {
                            arr.push(error);
                        }).on("end", function () {
                            var buffer = Buffer.concat(arr);
                            console.error(JSON.parse(buffer.toString()));
                        });
                    };
                    // pusti vsetky
                    for (i = 0; i < threads; i++) {
                        _loop_2(i);
                    }
                    return [3 /*break*/, 5];
                case 1: 
                // pust jedn
                return [4 /*yield*/, connectToDB()];
                case 2:
                    // pust jedn
                    _a.sent();
                    return [4 /*yield*/, scrapeSite(Number(thread))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, client.end()];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
main();
