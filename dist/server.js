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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const playwright_1 = require("playwright");
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
const PORT = 3000;
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
let browser;
function launchBrowser() {
    return __awaiter(this, void 0, void 0, function* () {
        browser = yield playwright_1.chromium.launch();
    });
}
launchBrowser();
const folder = './cachedSS/';
function countFilesInDirectory(folder) {
    fs_1.default.readdir(folder, (err, files) => {
        return files.length;
    });
    return 0;
}
let numCached = countFilesInDirectory(folder);
console.log("Number cached: ", numCached);
function isValidUrl(url) {
    // Checks if the given url is valid
    // Uses regex for any URL that is a base URL, has a subdomain, or a path
    // Taken from freeCodeCamp: https://www.freecodecamp.org/news/how-to-write-a-regular-expression-for-a-url/
    // Modified to require https or http and allow any amount of subpaths, query parameters, hash fragments
    const urlRegex = /^(https?:\/\/)([\w.-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?(?:\?[^\s#]*)?(?:#[^\s]*)?$/;
    return urlRegex.test(url);
}
function isValidArgs(url, format, annotate, hardRefresh, fullPage) {
    // Check if each arg is valid
    if (url === '') {
        return 'URL parameter is required';
    }
    if (!isValidUrl(url)) {
        return 'URL must match format with optional subpaths, query parameters, or hash fragments: https://example.com';
    }
    if (format !== 'png' && format !== 'base64') {
        return 'Format must be png or base64';
    }
    if (annotate !== 'true' && annotate !== 'false') {
        return 'Annotate must be true or false';
    }
    if (hardRefresh !== 'true' && hardRefresh !== 'false') {
        return 'Hard refresh must be true or false';
    }
    if (fullPage !== 'true' && fullPage !== 'false') {
        return 'Full page must be true or false';
    }
    return '';
}
function sanitizeFilename(name) {
    return name.replace(/[^a-z0-9]/gi, '').toLowerCase(); // Remove illegal characters
}
app.get('/', (req, res) => {
    res.send('Screenshot API!');
});
app.get('/screenshot', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const url = String(req.query.url || '');
    console.log("Received request for: ", url);
    const format = String(req.query.format || 'png');
    console.log("Returning in ", format);
    const annotate = String(req.query.annotate || 'false');
    console.log("Annotating: ", annotate);
    const hardRefresh = String(req.query.hardRefresh || 'false');
    console.log("Hard refreshing: ", hardRefresh);
    const fullPage = String(req.query.fullPage || 'false');
    console.log("Full page: ", fullPage);
    const valid = isValidArgs(url, format, annotate, hardRefresh, fullPage);
    if (valid !== '') {
        return res.status(400).json({ error: valid });
    }
    //File path for caching
    const filePath = folder + sanitizeFilename(url) + '.png';
    if (hardRefresh === 'false' && fs_1.default.existsSync(filePath)) {
        //Return cached PNG
        try {
            const cachedScreenshot = fs_1.default.readFileSync(filePath);
            console.log('File read successfully, returning cached PNG');
            res.setHeader('Content-Type', 'image/png');
            res.send(cachedScreenshot);
        }
        catch (error) {
            console.error('Error reading the file:', error);
            res.status(500).json({ error: 'Failed to capture screenshot ' + error });
        }
    }
    else {
        try {
            const page = yield browser.newPage();
            yield page.setViewportSize({ width: 1920, height: 1080 });
            // Go to page and wait for all dynamic components loaded
            yield page.goto(url, { waitUntil: 'networkidle' });
            yield page.waitForFunction(() => document.readyState === 'complete');
            const screenshotBuffer = yield page.screenshot({ type: 'png' });
            res.setHeader('Content-Type', 'image/png');
            res.send(screenshotBuffer);
            console.log("Saving to ", filePath);
            fs_1.default.writeFile(filePath, screenshotBuffer, (err) => {
                if (err) {
                    console.error('Failed to save the screenshot:', err);
                }
                else {
                    console.log('Screenshot saved successfully.');
                    numCached += 1;
                }
            });
        }
        catch (error) {
            console.error('Failed to capture screenshot:', error);
            //Propagate error to user
            res.status(500).json({ error: 'Failed to capture screenshot ' + error });
        }
    }
}));
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
