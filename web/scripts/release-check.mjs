import {readFile} from 'node:fs/promises';
const data=JSON.parse(await readFile('.generated/content.json','utf8'));
const reasons=[];
for(const [key,value] of Object.entries(data.settings.publicLinks))if(!value)reasons.push(`links.${key}: 設定待ち`);
for(const key of ['senderName','senderContact'])if(!data.settings[key])reasons.push(`${key}: 設定待ち`);
for(const e of data.editions){if(e.status!=='active')reasons.push(`${e.id}: 本番用の承認なし (${e.status})`);if(/(?:^|\n)\s*(?:編集メモ[：:]|TODO\b|FIXME\b)/m.test(e.bodyMarkdown))reasons.push(`${e.id}: 内部編集メモあり`);}
reasons.push('実メールアダプターは未実装。公開・送信を有効にする設定はありません。');
console.error('公開書き出しを停止しました。\n'+reasons.map(s=>`- ${s}`).join('\n'));
process.exitCode=1;
