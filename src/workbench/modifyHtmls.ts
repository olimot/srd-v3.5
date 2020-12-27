import { Console } from 'console';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import puppeteer from 'puppeteer';
import { Writable } from 'stream';
import { pathToFileURL } from 'url';

const numCPUs = os.cpus().length;
process.setMaxListeners(numCPUs);

const buildWorkingLabel = (workerIndex: number, url: string) => `(Worker ${workerIndex + 1}, ${url})`;

const ansiReturn = `\x1b[F\x1b[2K`;

const modifyHtmls = async <TReturn = void>(
  inDir: string,
  outDir: string,
  pageFunction: () => TReturn,
): Promise<Record<string, TReturn>> => {
  const pageFileUrls = fs.readdirSync(inDir).map(a => pathToFileURL(path.resolve(inDir, a)).href);
  fs.ensureDirSync(outDir);

  let progress = 0;
  const workerCount = Math.min(numCPUs, pageFileUrls.length);
  console.log(`${workerCount} workers will start modifying html pages.`);
  const browser = await puppeteer.launch();
  const result: Record<string, TReturn> = {};
  try {
    await Promise.all(
      Array.from(Array(workerCount), async (_0, workerIndex) => {
        const assignedPageFiles = pageFileUrls.filter((_1, i) => i % workerCount === workerIndex);
        const page = await browser.newPage();
        const pageTotal = assignedPageFiles.length;
        for (let pageIndex = 0; pageIndex < pageTotal; pageIndex += 1) {
          const fileUrl = assignedPageFiles[pageIndex];
          const lr = { value: '' };
          const ct = new Console(
            new Writable({ write: (c, e, n) => Object.assign(lr, { value: `${lr.value}${c.toString()}` }) && n() }),
          );
          const workingLabel = buildWorkingLabel(workerIndex, fileUrl);
          ct.time(workingLabel);
          await page.goto(fileUrl);
          try {
            const filename = decodeURIComponent(path.basename(fileUrl));
            const pageResult = await page.evaluate(pageFunction);
            if (pageResult || (pageResult as any) === 0) result[filename] = pageResult as TReturn;
            const html = await page.evaluate(() => document.documentElement.outerHTML);
            await fs.writeFile(path.resolve(outDir, filename), `<!DOCTYPE html>\n${html}`);
            ct.timeEnd(workingLabel);
            progress += 1;
            console.log(`${ansiReturn}${progress}/${pageFileUrls.length}`, lr.value.trim());
          } catch (e) {
            console.error(e);
          }
        }
      }),
    );
    await browser.close();
    return result;
  } catch (e) {
    await browser.close();
    return result;
  }
};

export default modifyHtmls;
