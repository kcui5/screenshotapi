import express, { Request, Response } from 'express';
import helmet from 'helmet';
import { Browser, chromium } from 'playwright';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(helmet());

let browser: Browser;

async function launchBrowser() {
    browser = await chromium.launch();
}

launchBrowser();

const folder = './cachedSS/';

function countFilesInDirectory(folder: string) {
    //TODO: Count files in given directory folder
    return 0;
}

let numCached = countFilesInDirectory(folder);
console.log("Number cached: ", numCached);

function isValidUrl(url: string): boolean {
    // Checks if the given url is valid
    // Uses regex for any URL that is a base URL, has a subdomain, or a path
    // Taken from freeCodeCamp: https://www.freecodecamp.org/news/how-to-write-a-regular-expression-for-a-url/
    // Modified to require https or http and allow any amount of subpaths, query parameters, hash fragments
    const urlRegex = /^(https?:\/\/)([\w.-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?(?:\?[^\s#]*)?(?:#[^\s]*)?$/;
    return urlRegex.test(url);
}

function isValidArgs(url: string, format: string, annotate: string, hardRefresh: string, fullPage: string): string {
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
    return ''
}

function sanitizeFilename(name: string) {
    return name.replace(/[^a-z0-9]/gi, '').toLowerCase(); // Remove illegal characters
}

app.get('/', (req: Request, res: Response) => {
    res.send('Screenshot API!');
});

app.get('/screenshot', async (req: Request, res: Response) => {
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
        return res.status(400).json({ error: valid })
    }

    //File path for caching
    const filePath = folder + sanitizeFilename(url) + '.png'

    if (hardRefresh === 'false' && fs.existsSync(filePath)) {
        //Return cached PNG
        try {
            const cachedScreenshot = fs.readFileSync(filePath);
            console.log('File read successfully, returning cached PNG');
            res.setHeader('Content-Type', 'image/png');
            res.send(cachedScreenshot);
        } catch (error) {
            console.error('Error reading the file:', error);
            res.status(500).json({ error: 'Failed to capture screenshot ' + error });
        }
    } else {
        try {
            const page = await browser.newPage();

            await page.setViewportSize({ width: 1920, height: 1080 });

            // Go to page and wait for all dynamic components loaded
            await page.goto(url, { waitUntil: 'networkidle' });
            await page.waitForFunction(() => document.readyState === 'complete');
            const screenshotBuffer = await page.screenshot({ type: 'png' });

            res.setHeader('Content-Type', 'image/png');
            res.send(screenshotBuffer);

            console.log("Saving to ", filePath);
            fs.writeFile(filePath, screenshotBuffer, (err) => {
                if (err) {
                    console.error('Failed to save the screenshot:', err);
                } else {
                    console.log('Screenshot saved successfully.');
                    numCached += 1;
                }
            });
        } catch (error) {
            console.error('Failed to capture screenshot:', error);
            //Propagate error to user
            res.status(500).json({ error: 'Failed to capture screenshot ' + error });
        }
    }
    
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
