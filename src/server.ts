import express, { Request, Response } from 'express';
import { Browser, chromium } from 'playwright';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('Screenshot API!');
});

function isValidUrl(url: string): boolean {
    // Checks if the given url is valid
    // Uses regex for any URL that is a base URL, has a subdomain, or a path
    // Taken from freeCodeCamp: https://www.freecodecamp.org/news/how-to-write-a-regular-expression-for-a-url/
    // Modified to require https or http and allow any amount of subpaths, query parameters, hash fragments
    const urlRegex = /^(https?:\/\/)([\w.-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?(?:\?[^\s#]*)?(?:#[^\s]*)?$/;
    return urlRegex.test(url);
}

app.get('/screenshot', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    console.log("Received request for: ", url);

    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    } else if (!isValidUrl(url)) {
        return res.status(400).json({ error: 'URL must match format with optional subpaths, query parameters, or hash fragments: https://example.com' });
    }

    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();

        // Go to page and wait for idle (no network connections for at least 500 ms)
        // to ensure all dynamic components loaded
        await page.goto(url, { waitUntil: 'networkidle' });
        const screenshotBuffer = await page.screenshot({ type: 'png' });
        await browser.close();

        res.setHeader('Content-Type', 'image/png');
        res.send(screenshotBuffer);
    } catch (error) {
        console.error('Failed to capture screenshot:', error);
        //Propagate error to user
        res.status(500).json({ error: 'Failed to capture screenshot ' + error });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
