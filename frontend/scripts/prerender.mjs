import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { publicPages, utilityPages, render, SITE_URL } from '../dist-ssr/entry-server.js';

const template = await readFile('dist/index.html', 'utf8');
assert(template.includes('<!--seo-head-->'), 'Missing SEO head placeholder');
assert(template.includes('<div id="root"></div>'), 'Missing React root placeholder');
assert.equal(new Set(publicPages.map((page) => page.path)).size, publicPages.length, 'Duplicate public paths');
assert.equal(new Set(publicPages.map((page) => page.title)).size, publicPages.length, 'Duplicate public titles');

for (const page of [...publicPages, ...utilityPages, { path: '/404', index: false }]) {
  // Utility pages contain account state; only their metadata is prerendered.
  const { html, head } = await render(page.path, page.index || page.path === '/404');
  assert(head.includes(page.index ? 'index, follow' : 'noindex, follow'), `${page.path}: incorrect indexing`);
  assert.equal((head.match(/rel="canonical"/g) ?? []).length, page.index ? 1 : 0, `${page.path}: incorrect canonical count`);
  if (page.index) {
    assert(head.includes(`href="${SITE_URL}${page.path}"`), `${page.path}: incorrect canonical`);
    assert(html.includes('<h1'), `${page.path}: missing prerendered heading`);
    assert(!html.includes('Loading visualizer'), `${page.path}: unresolved lazy component`);
  }
  const file = resolve('dist', page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, template.replace('<!--seo-head-->', () => head).replace('<div id="root"></div>', () => `<div id="root">${html}</div>`));
}

const directory = await readFile('dist/visualizations.html', 'utf8');
for (const page of publicPages.filter((page) => page.path.startsWith('/visualize/'))) {
  assert(directory.includes(`href="${page.path}"`), `Directory missing ${page.path}`);
}

await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicPages.map((page) => `  <url><loc>${SITE_URL}${page.path}</loc></url>`).join('\n')}
</urlset>
`);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`Prerendered ${publicPages.length} public pages; utility metadata, 404, sitemap and robots.txt generated.`);
