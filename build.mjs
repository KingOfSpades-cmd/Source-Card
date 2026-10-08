import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';
import sharp from 'sharp';

const projectDirectory = dirname(fileURLToPath(import.meta.url));
const outputDirectory = join(projectDirectory, 'dist');

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

await Promise.all([
    copyFile(join(projectDirectory, 'index.html'), join(outputDirectory, 'index.html')),
    copyFile(join(projectDirectory, 'style.css'), join(outputDirectory, 'style.css')),
]);

const sourceScript = await readFile(join(projectDirectory, 'script.js'), 'utf8');
const { code } = await transform(sourceScript, {
    loader: 'js',
    minify: true,
    target: 'es2020',
});
await writeFile(join(outputDirectory, 'script.js'), code);

const sourceImage = join(projectDirectory, 'sc_favicon.png');
const outputImage = join(outputDirectory, 'sc_favicon.png');
const originalImageSize = (await stat(sourceImage)).size;
const optimizedImage = await sharp(sourceImage)
    .resize({ width: 256, height: 256, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 100, effort: 10 })
    .toFile(outputImage);

const savedBytes = originalImageSize - optimizedImage.size;
const savedPercent = Math.round((savedBytes / originalImageSize) * 100);
console.log(`Built dist: script.js minified; sc_favicon.png ${originalImageSize} -> ${optimizedImage.size} bytes (${savedPercent}% smaller).`);