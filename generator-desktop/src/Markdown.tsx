import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import MarkdownIt,{type Token} from 'markdown-it';import {headingId,type LinkKind} from './links';
const parser=new MarkdownIt({html:false,linkify:false,typographer:false});
export function headings(text:string){const tokens=parser.parse(text,{}),counts=new Map<string,number>();return tokens.flatMap((t,i)=>{if(t.type!=='heading_open')return[];const title=tokens[i+1].content,base=headingId(title),n=counts.get(base)||0;counts.set(base,n+1);return[{id:base+(n?'-'+n:''),title}]})}
function Asset({id,alt}:{id:string;alt:string}){const ref=useRef<HTMLSpanElement>(null),[src,setSrc]=useState('');useEffect(()=>{let active=true;const observer=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;observer.disconnect();void window.tsukuhako.readAsset({id}).then(r=>{if(active&&r.ok)setSrc(r.value)})});if(ref.current)observer.observe(ref.current);return()=>{active=false;observer.disconnect()}},[id]);return <span ref={ref} className="lesson-asset">{src?<img src={src} alt={alt} loading="lazy" width="96" height="96"/>:alt}</span>}
function Code({text,language}:{text:string;language:string}){const [note,setNote]=useState('');return <div className="code-block"><div className="code-toolbar"><span>{language||'コード'}</span><button type="button" onClick={async()=>{try{try{await navigator.clipboard.writeText(text)}catch{const previous=document.activeElement;const field=document.createElement('textarea');field.value=text;field.className='copy-field';document.body.append(field);field.select();const ok=document.execCommand('copy');field.remove();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus({preventScroll:true});if(!ok)throw new Error('copy')}setNote('コピーしました')}catch{setNote('文字列を選んでコピーしてください')}}}>コードをコピー</button><span role="status">{note}</span></div><pre><code>{text}</code></pre></div>}
export default function Markdown({text,onLink,onReady,linkKind}:{text:string;onLink:(href:string)=>void;onReady?:()=>void;linkKind?:(href:string)=>LinkKind}){
 useLayoutEffect(()=>{onReady?.()},[text]);
 const tokens=parser.parse(text,{});const hs=headings(text);let hn=0;
 function render(tokens:Token[]):React.ReactNode[]{let pos=0;const sequence=(closing=false):React.ReactNode[]=>{const out:React.ReactNode[]=[];while(pos<tokens.length){const index=pos,t=tokens[pos++];if(t.nesting===-1){if(closing)return out;continue}
  if(t.type==='inline'){out.push(...render(t.children||[]));continue}
  if(t.type==='fence'||t.type==='code_block'){out.push(<Code key={index} text={t.content} language={t.info.trim()}/>);continue}
  if(t.type==='image'){const src=String(t.attrGet('src')||'');out.push(src.startsWith('asset:')?<Asset key={index} id={src.slice(6)} alt={t.content}/>:<span key={index}>{t.content}（図は同梱の対応教材で確認）</span>);continue}
  if(t.type==='code_inline'){out.push(<code key={index}>{t.content}</code>);continue}
  if(t.type==='softbreak'||t.type==='hardbreak'){out.push(<br key={index}/>);continue}
  if(t.type==='hr'){out.push(<hr key={index}/>);continue}
  if(t.nesting===1){const children=sequence(true);if(t.type==='link_open'){const href=String(t.attrGet('href')||'');const kind=linkKind?.(href);out.push(kind&&"path" in kind?<span className="file-reference" key={index}>{children}<small>{kind.kind==="file"?` — 生成先の ${kind.path} をVS Codeで開きます`:kind.kind==="reference"?" — 参照資料（アプリには未収録）":" — 参照先（この画面からは開きません）"}</small></span>:<button className="lesson-link" type="button" key={index} onClick={()=>onLink(href)}>{children}{kind?.kind==="external"&&" ↗"}</button>)}else{const tags=['p','h1','h2','h3','h4','h5','h6','ul','ol','li','blockquote','strong','em','s','table','thead','tbody','tr','th','td'];const tag=tags.includes(t.tag)?t.tag:'span';const id=t.type==='heading_open'?hs[hn++]?.id:undefined;out.push(React.createElement(tag,{key:index,id,tabIndex:id?-1:undefined},children))}continue}
  if(t.content)out.push(t.content);
 }return out};return sequence()}
 return <article className="markdown">{render(tokens)}</article>
}
