import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import YAML from 'yaml';

const root = resolve(process.env.CONTENT_ROOT || '../docs/launch');
const ids = ['confirm', 'welcome-01', 'welcome-02', 'welcome-03', 'broadcast-001'];
const guideNames = ['start', 'setup-check', 'first-change', 'one-less-step'];
const fixedKeys = ['brainProduct','startGuide','setupGuide','exerciseGuide','updateNotes','subscribe','support','privacy'];
const runtimeKeys = ['confirmUrl','unsubscribeUrl','confirmationExpiresAtJST','senderName','senderContact'];
function markdown(source, filename) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: YAML frontmatter required`);
  return { ...YAML.parse(match[1]), bodyMarkdown: match[2].trim() };
}
function inspectVariables(text, filename) {
  for (const [, key] of text.matchAll(/{{\s*([^{}]+?)\s*}}/g)) {
    if (!runtimeKeys.includes(key) && !(key.startsWith('links.') && fixedKeys.includes(key.slice(6)))) {
      throw new Error(`${filename}: unsupported or private variable ${key}`);
    }
  }
}
const editions = [];
for (const id of ids) {
  const file = `mail/${id}.md`;
  const doc = markdown(await readFile(resolve(root, file), 'utf8'), file);
  if (doc.id !== id || !['transactional','step','broadcast'].includes(doc.type) || !Number.isInteger(doc.revision) || !Array.isArray(doc.links) || !Array.isArray(doc.sourceRefs) || !doc.subject || !doc.audience) throw new Error(`${file}: invalid mail metadata`);
  if (doc.links.some(k => !fixedKeys.includes(k))) throw new Error(`${file}: unapproved link key`);
  inspectVariables(doc.subject + doc.bodyMarkdown, file);
  editions.push(doc);
}
const footer = (await readFile(resolve(root, 'mail/footer.md'), 'utf8')).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
const transactionalFooter = (await readFile(resolve(root, 'mail/transactional-footer.md'), 'utf8')).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
inspectVariables(footer + transactionalFooter, 'footer');
const guides = Object.fromEntries(await Promise.all(guideNames.map(async name => {
  const doc = await readFile(resolve(root, `guides/${name}.md`), 'utf8');
  inspectVariables(doc, name);
  return [name, doc.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim()];
})));
const sourceLinks = JSON.parse(await readFile(resolve(root, 'LINKS.example.json'), 'utf8'));
const screenCopy = JSON.parse(await readFile(resolve(root, 'screen-copy.json'), 'utf8'));
const settings = JSON.parse(await readFile('config/public-settings.json','utf8'));
if (Object.keys(settings.publicLinks).some(k => !fixedKeys.includes(k))) throw new Error('Private/unknown keys are forbidden in public settings');
for (const [key,value] of Object.entries(settings.publicLinks)) {
  if (value !== null && (typeof value !== 'string' || !value.startsWith('https://'))) throw new Error(`publicLinks.${key}: use null or confirmed HTTPS URL`);
}
const content = { editions, footer, transactionalFooter, guides, screenCopy, sourceLinks, settings };
content.sourceHash = createHash('sha256').update(JSON.stringify(content)).digest('hex');
await mkdir('.generated', {recursive:true});
await writeFile('.generated/content.json', JSON.stringify(content, null, 2) + '\n');
console.log(`Imported ${editions.length} draft mails and ${guideNames.length} public guides directly from docs/launch (hash ${content.sourceHash.slice(0,12)}).`);
