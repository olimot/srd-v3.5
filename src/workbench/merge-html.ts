import fs from 'fs-extra';
import path from 'path';

const index = async () => {
  const inDir = './public/raw-html';
  const htmlInBodies = await fs.readdir(inDir).then(as =>
    Promise.all(
      as
        .filter(a => a.match(/\.html$/i))
        .map(async a => {
          const text = (await fs.readFile(path.resolve(inDir, a), 'utf8')).replace(/\s+/g, ' ');
          const [, inbody] = text.split(/<body[^<>]*>|<\/body>/gi);
          return inbody;
        }),
    ),
  );
  const joined = htmlInBodies.map((a,i)=>`<div${i ? ` style="margin-top:1em;"` :''}>${a}</div>`).join('');
  await fs.writeFile(
    './.cache/merged.html',
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SRD v3.5</title><style>table, table * { border-collapse: collapse; page-break-inside: avoid; } body { font: 13.3333px "Times New Roman", serif; }</style></head><body>${joined}</body></html>`,
  );
};

export default index;
