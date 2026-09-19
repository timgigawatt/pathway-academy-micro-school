// Shared by context.mjs and validate.mjs. Zero dependencies on purpose: this runs in a
// pre-commit hook and must never depend on node_modules being installed.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

export const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
export const P = {
  blocks: join(ROOT, 'src/blocks'),
  pages: join(ROOT, 'src/content/pages'),
  globals: join(ROOT, 'src/content/globals'),
  content: join(ROOT, 'src/content'),
  media: join(ROOT, 'src/assets/media'),
  files: join(ROOT, 'src/assets/files'),
  collectionsConfig: join(ROOT, 'src/content.config.ts'),
  context: join(ROOT, '_context'),
};

export const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
export const listFiles = (dir, ext) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => !f.startsWith('.') && (!ext || extname(f) === ext)).sort() : [];

// { Hero: { schema, dir }, ... } from src/blocks/*/schema.json. Sites that render through
// @gigawatt/blocks (or their own components) have no local schemas → {}.
export function loadBlocks() {
  const out = {};
  if (!existsSync(P.blocks)) return out;
  for (const name of readdirSync(P.blocks)) {
    const dir = join(P.blocks, name);
    if (!statSync(dir).isDirectory()) continue;
    const sp = join(dir, 'schema.json');
    if (existsSync(sp)) out[name] = { schema: readJson(sp), dir };
  }
  return out;
}

// Pages: [{ slug, route, file, page, blocks }]. Two page shapes are understood:
//   template:  { title, description, published, blocks: [{ block: 'Hero', ... }] }
//   cms-export:{ title, slug, seo, layout: [{ blockType: 'hero', ... }] }   (Payload doc, kept verbatim)
// `blocks` is the normalized list: [{ name, variant, label, fields }].
export function loadPages() {
  // home.json first, then alphabetical — matches how a reader thinks about the site.
  const files = listFiles(P.pages, '.json').sort((a, b) => (a === 'home.json' ? -1 : b === 'home.json' ? 1 : a.localeCompare(b)));
  return files.map((f) => {
    const slug = basename(f, '.json');
    const page = readJson(join(P.pages, f));
    const raw = page.blocks ?? page.layout ?? [];
    const blocks = raw.map((b) => {
      const { block, blockType, variant, ...fields } = b;
      const name = block ?? blockType ?? '?';
      const label = (b.heading ?? b.headline ?? b.title ?? null)?.replace(/\s*\n\s*/g, ' ') ?? null;
      return { name, variant: variant ?? null, label, fields };
    });
    return { slug, route: slug === 'home' ? '/' : `/${slug}/`, file: `src/content/pages/${f}`, page, blocks, shape: page.blocks ? 'template' : 'cms-export' };
  });
}

// Collections: parsed loosely from content.config.ts — name, folder, and the schema
// field names/types as written. Good enough for structure.md; zod is the real validator.
export function loadCollections() {
  if (!existsSync(P.collectionsConfig)) return loadJsonCollections();
  const src = readFileSync(P.collectionsConfig, 'utf8');
  const baseMatch = src.match(/const base = \{([\s\S]*?)\n\};/);
  const baseFields = baseMatch ? parseFields(baseMatch[1]) : [];
  const out = [];
  const re = /const (\w+) = defineCollection\(\{([\s\S]*?)\n\}\);/g;
  let m;
  while ((m = re.exec(src))) {
    const [, name, body] = m;
    const folder = (body.match(/base:\s*'([^']+)'/) || [])[1] || '';
    const pattern = (body.match(/pattern:\s*'([^']+)'/) || [])[1] || '';
    const own = parseFields((body.match(/schema:\s*z\.object\(\{([\s\S]*?)\}\)/) || ['', ''])[1]);
    const usesBase = /z\.object\(base\)/.test(body) || /\.\.\.base/.test(body);
    const fields = usesBase ? [...baseFields, ...own] : own;
    const dir = join(ROOT, folder);
    const entries = listFiles(dir).filter((f) => /\.(md|mdx)$/.test(f)).map((f) => ({ file: `${folder.replace(/^\.\//, '')}/${f}`, ...frontmatter(readFileSync(join(dir, f), 'utf8')) }));
    out.push({ name, folder: folder.replace(/^\.\//, ''), pattern, fields, entries });
  }
  // JSON folders under src/content that the config doesn't define are data collections too.
  const defined = new Set(out.map((c) => c.name));
  for (const c of loadJsonCollections()) if (!defined.has(c.name)) out.push(c);
  return out;
}

// No content.config.ts: every folder under src/content except pages/ and globals/ is a JSON
// collection (cms-export sites). Fields = union of top-level keys.
function loadJsonCollections() {
  if (!existsSync(P.content)) return [];
  return readdirSync(P.content)
    .filter((d) => !['pages', 'globals', 'media'].includes(d) && statSync(join(P.content, d)).isDirectory())
    .sort()
    .map((name) => {
      const dir = join(P.content, name);
      const entries = listFiles(dir, '.json').map((f) => { const d = readJson(join(dir, f)); return { file: `src/content/${name}/${f}`, data: { title: d.title ?? d.name, pubDate: d.pubDate ?? d.publishedAt, draft: d.draft ?? d._status === 'draft' }, keys: Object.keys(d) }; });
      const keys = [...new Set(entries.flatMap((e) => e.keys))];
      return { name, folder: `src/content/${name}`, pattern: '*.json', fields: keys.map((k) => ({ key: k, def: 'json' })), entries };
    });
}

function parseFields(block) {
  return block.split('\n').map((l) => l.trim()).filter((l) => /^\w+:/.test(l)).map((l) => {
    const [, key, def] = l.match(/^(\w+):\s*(.*?),?$/);
    return { key, def: def.replace(/^image\b/, 'image{src,alt}') };
  });
}

// Minimal YAML front-matter reader: scalars, quoted strings, [a, b] arrays.
export function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const data = {};
  if (m) for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    else if (/^".*"$/.test(v)) v = v.slice(1, -1);
    else if (v === 'true' || v === 'false') v = v === 'true';
    data[kv[1]] = v;
  }
  return { data };
}

// --- tiny JSON Schema validator: type, required, properties, additionalProperties,
// enum, const, items, minItems, maxLength, pattern, default (ignored), $ref (#/$defs/x).
export function validate(schema, value, root = schema, path = '$') {
  const errs = [];
  if (schema.$ref) {
    const target = schema.$ref.replace(/^#\//, '').split('/').reduce((o, k) => o?.[k], root);
    if (!target) return [`${path}: unresolved $ref ${schema.$ref}`];
    return validate(target, value, root, path);
  }
  if ('const' in schema && value !== schema.const) errs.push(`${path}: must be ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) errs.push(`${path}: must be one of ${schema.enum.join(', ')}`);
  if (schema.type) {
    const t = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
    const ok = schema.type === 'integer' ? Number.isInteger(value) : t === schema.type;
    if (!ok) return [...errs, `${path}: expected ${schema.type}, got ${t}`];
  }
  if (schema.type === 'string') {
    if (schema.maxLength != null && value.length > schema.maxLength) errs.push(`${path}: longer than ${schema.maxLength} chars`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errs.push(`${path}: does not match ${schema.pattern}`);
  }
  if (schema.type === 'array') {
    if (schema.minItems != null && value.length < schema.minItems) errs.push(`${path}: needs at least ${schema.minItems} items`);
    if (schema.items) value.forEach((v, i) => errs.push(...validate(schema.items, v, root, `${path}[${i}]`)));
  }
  if (schema.type === 'object') {
    for (const r of schema.required || []) if (!(r in value)) errs.push(`${path}: missing required "${r}"`);
    for (const [k, v] of Object.entries(value)) {
      if (schema.properties?.[k]) errs.push(...validate(schema.properties[k], v, root, `${path}.${k}`));
      else if (schema.additionalProperties === false) errs.push(`${path}: unknown field "${k}"`);
    }
  }
  return errs;
}
