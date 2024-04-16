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
const playwright_1 = require("playwright");
const app = (0, express_1.default)();
const PORT = 3000;
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Screenshot API!');
});
function isValidUrl(url) {
    // Checks if the given url is valid
    // Uses regex for any URL that is a base URL, has a subdomain, or a path
    // Taken from freeCodeCamp: https://www.freecodecamp.org/news/how-to-write-a-regular-expression-for-a-url/
    // Modified to require https or http and allow any amount of subpaths, query parameters, hash fragments
    return true;
    const urlRegex = /^(https?:\/\/)([\w.-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?(?:\?[^\s#]*)?(?:#[^\s]*)?$/;
    return urlRegex.test(url);
}
app.get('/screenshot', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const url = req.query.url;
    console.log("Received request for: ", url);
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    else if (!isValidUrl(url)) {
        return res.status(400).json({ error: 'URL must match format with optional subpaths, query parameters, or hash fragments: https://example.com' });
    }
    try {
        const browser = yield playwright_1.chromium.launch();
        const page = yield browser.newPage();
        // Go to page and wait for idle (no network connections for at least 500 ms)
        // to ensure all dynamic components loaded
        yield page.goto(url, { waitUntil: 'networkidle' });
        const screenshotBuffer = yield page.screenshot({ type: 'png' });
        yield browser.close();
        res.setHeader('Content-Type', 'image/png');
        res.send(screenshotBuffer);
    }
    catch (error) {
        console.error('Failed to capture screenshot:', error);
        res.status(500).json({ error: 'Failed to capture screenshot ' + error });
    }
}));
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
