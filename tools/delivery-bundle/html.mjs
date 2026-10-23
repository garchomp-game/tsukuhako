import fs from 'node:fs';
import MarkdownIt from '../../generator-desktop/node_modules/markdown-it/dist/markdown-it.mjs';
import {guides,guideDirectory,guideRevision,productVersion,platforms} from './config.mjs';
// Same parser and conservative options as the application's Markdown reader.
const parser = new MarkdownIt({html:false, linkify:false, typographer:false, breaks:true});
const escape = parser.utils.escapeHtml;
const slug = text => text.toLowerCase().trim().replace(/[^\p{L}\p{N}\s_-]/gu,'').replace(/\s+/g,'-');
export const css = `
:root{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#183e37;background:#f6f5ef;font-size:17px;line-height:1.85;color-scheme:light}
*{box-sizing:border-box}body{margin:0}main{max-width:1060px;padding:40px 32px 64px;margin:auto}h1,h2,h3{line-height:1.5;letter-spacing:.01em;overflow-wrap:anywhere}h1{font-size:2rem;margin:.4em 0}h2{font-size:1.5rem;margin-top:1.4em}h3{font-size:1.15rem}p,li,td,th{overflow-wrap:anywhere}a{color:#075f73;text-underline-offset:.18em}a:hover{color:#073b46}a:focus-visible{outline:3px solid #d87c18;outline-offset:4px}a.action{display:block;padding:16px 20px;border:2px solid #246250;border-radius:10px;background:#fff;text-decoration:none;font-weight:700;margin:1em 0}a.primary{color:#fff;background:#194f40}header{border-bottom:1px solid #c6d7cf;padding-bottom:20px}.brand{font-weight:700;letter-spacing:.15em}.meta{font-size:.88rem;color:#47665c}.notice,nav{padding:20px;background:#eaf0eb;border-radius:12px;margin:24px 0}nav ul{display:flex;flex-wrap:wrap;gap:8px 24px;padding-left:22px;margin:0}section{scroll-margin-top:24px}section.guide{border-top:1px solid #c6d7cf;margin-top:42px;padding-top:24px}table{border-collapse:collapse;width:100%;table-layout:fixed;margin:20px 0;font-size:.92rem}td,th{border:1px solid #b9cbc3;padding:10px;text-align:left;vertical-align:top}th{background:#eaf0eb}pre{background:#163d35;color:#f6f6ef;padding:16px;border-radius:8px;white-space:pre-wrap;overflow-wrap:anywhere;tab-size:2}code{font-family:ui-monospace,monospace;font-size:.9em;overflow-wrap:anywhere}p code,li code,td code{background:#e7ece7;padding:.1em .25em}blockquote{border-left:4px solid #668c7b;padding:0 18px;margin-left:0}footer{border-top:1px solid #c6d7cf;margin-top:36px;padding-top:20px;font-size:.85rem}ol,ul{padding-left:1.5em}.skip{position:absolute;left:-10000px}.skip:focus{position:static}h2[id],h3[id],h4[id]{scroll-margin-top:24px}
@media(max-width:600px){:root{font-size:16px}main{padding:24px 16px 40px}h1{font-size:1.65rem}nav ul{display:block}nav li{margin:.6em 0}td,th{padding:7px;font-size:.86rem}a.action{padding:14px}pre{padding:12px}}
@media print{body{background:white}main{max-width:none;padding:0}nav{break-after:avoid}a{color:inherit}section{break-before:auto}pre{background:#eee;color:black}}
`;
export function page(title,body){return '<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><title>'+escape(title)+'</title><style>'+css+'</style></head><body><a class="skip" href="#main">本文へ</a><main id="main">'+body+'</main></body></html>\n';}
export function readGuides(){return guides.map(g=>({...g,text:fs.readFileSync(guideDirectory+'/'+g.file,'utf8')}));}
export function renderGuide(sources=readGuides()){
 const documents=sources.map(g=>{
  const tokens=parser.parse(g.text,{}),headings=new Map(),counts=new Map();
  for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.type==='heading_open'){
   const base=slug(tokens[i+1].content),n=counts.get(base)||0;counts.set(base,n+1);const local=base+(n?'-'+n:'');const id=g.id+'--'+local;headings.set(local,id);t.attrSet('id',id);t.attrSet('tabindex','-1');
  }if(t.type==='heading_open'||t.type==='heading_close')t.tag='h'+Math.min(6,Number(t.tag.slice(1))+1);}
  return {...g,tokens,headings};
 });
 for(const d of documents)for(const t of d.tokens.flatMap(t=>t.children||[])){
  if(t.type==='image')throw Error('Guide images must be bundled explicitly');
  if(t.type!=='link_open')continue;const href=t.attrGet('href');if(href.startsWith('https://')){t.attrSet('rel','noreferrer');continue;}
  const [file,rawFragment]=href.split('#'),target=documents.find(g=>g.file===(file||d.file));if(!target)throw Error('Unknown guide link: '+href);
  const fragment=rawFragment?target.headings.get(decodeURIComponent(rawFragment)):target.id;if(!fragment)throw Error('Unknown guide heading: '+href);t.attrSet('href','#'+fragment);
 }
 const navigation='<nav aria-label="ガイドの目次"><ul>'+guides.map(g=>'<li><a href="#'+g.id+'">'+g.label+'</a></li>').join('')+'</ul></nav>';
 const body='<header><p class="brand">ツクハコ</p><h1>使い始めのガイド</h1><p class="meta">アプリ '+productVersion+' · ガイド '+guideRevision+'</p><p><a href="../00_START_HERE.html">商品一式の入口へ戻る</a></p></header>'+navigation+documents.map(d=>'<section class="guide" id="'+d.id+'" aria-label="'+d.label+'">'+parser.renderer.render(d.tokens,parser.options,{})+'<p><a href="#main">ガイドの目次へ戻る</a></p></section>').join('')+'<footer>このHTML本文はオフラインで読めます。公式サイトの閲覧や初回の開発環境構築にはネット接続が必要です。</footer>';
 return page('ツクハコ｜使い始めのガイド',body);
}
export function renderEntry(platform){
 const p=platforms[platform];if(!p)throw Error('Unknown platform');
 return page('ツクハコを始める｜'+p.label,'<header><p class="brand">ツクハコ</p><h1>ツクハコを始める</h1><p class="meta">'+p.label+'版 · アプリ '+productVersion+'</p><p>Next.jsなどの開発環境を生成するツールです。このZIPに、<strong>ツール本体と使い始めのガイド</strong>が入っています。アプリ内の教材も使えます。</p></header><section><h2>このOS版で確認できていること</h2><p>'+p.scope+'</p><p>'+p.prerequisites+'初回の取得・準備にはネット接続が必要です。</p><p>アプリや同梱教材の閲覧・生成に、アカウント登録やPC側のNode.jsは不要です。生成後のF2を動かす段階では、Dockerなど上の準備を使います。macOS・ARM版はこのZIPに含みません。</p></section><section><h2>1. 本体を起動する</h2><p><strong>ZIP全体を展開してから</strong>、下の導入手順を開いてください。ZIPのプレビュー画面の中から本体を起動しません。</p><a class="action primary" href="app/START_HERE.txt" target="_blank" rel="noopener">本体の導入手順を開く（別タブ）</a><p>OS別の照合・導入・起動は、この同梱の正規手順に沿って進めます。読み終えたらこの入口のタブへ戻れます。</p></section><section><h2>2. F2の最初の画面を表示する</h2><p>本体が起動したら、ガイドを開いてF2を一つ生成します。初期処理の「準備完了」と正常終了を確認し、Next.jsの最初の画面が表示できたら初回の到達点です。</p><a class="action primary" href="guide/index.html#first-run">F2の初回手順へ</a><p>ほかの構成を比較する必要はありません。既存のテンプレートや教材もアプリに残っています。</p></section><section><h2>止まったときと、その次</h2><a class="action" href="guide/index.html#troubleshooting">困ったとき・再開</a><a class="action" href="guide/index.html#next-step">任意：変更と復元</a><p><a href="guide/index.html#feedback">迷った場所を記録する</a> · <a href="guide/index.html">ガイドの目次</a></p></section><footer><p>この入口とガイド本文はネット接続なしで読めます。Markdown用の拡張やローカルサーバーは不要です。本文中の公式サイトを開くときはネット接続を使います。</p><p>生成後のプロジェクト内にあるSTART_HERE.mdには、選んだ保存先・ポート・起動方法が入ります。商品一式のこの入口や、app/START_HERE.txtとは別の案内です。</p></footer>');
}
