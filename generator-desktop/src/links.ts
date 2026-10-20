import type {Curriculum} from './types';
export function resolveChapter(m:Curriculum,lessonId:string,chapterId:string,href:string):{lessonId:string;chapterId:string;heading:string}|null{
 if(/[\x00-\x20\x7f\\]/.test(href)||href.length>2048)return null;
 const [target,rawHeading='']=href.split('#');let heading:string;try{heading=decodeURIComponent(rawHeading)}catch{return null}
 if(target.startsWith('lesson:')){const [lesson,chapter]=target.slice(7).split('/');return m.lessons.find(l=>l.id===lesson)?.chapters.some(c=>c.id===chapter)?{lessonId:lesson,chapterId:chapter,heading}:null}
 if(/^[a-zA-Z][\w+.-]*:/.test(target)||target.startsWith('//'))return null;
 const l=m.lessons.find(l=>l.id===lessonId),c=l?.chapters.find(c=>c.id===chapterId);if(!c)return null;
 if(!target)return{lessonId,chapterId,heading};let u:URL;try{u=new URL(target,'https://content.invalid/'+c.source)}catch{return null}
 let pathname:string;try{pathname=decodeURIComponent(u.pathname)}catch{return null}
 const found=l?.chapters.find(x=>'/'+x.source===pathname);return found?{lessonId,chapterId:found.id,heading}:null;
}
export type LinkKind = {kind:'chapter'|'external'} | {kind:'file'|'reference'|'unavailable';path:string};
export function classifyLink(m:Curriculum,lessonId:string,chapterId:string,href:string):LinkKind {
 if(resolveChapter(m,lessonId,chapterId,href))return{kind:'chapter'};
 if(/^https:\/\/[^\s]+$/.test(href))return{kind:'external'};
 const chapter=m.lessons.find(l=>l.id===lessonId)?.chapters.find(c=>c.id===chapterId);
 if(chapter&&!/^[a-zA-Z][\w+.-]*:|^\/|[\x00-\x20\x7f\\]/.test(href)){
  try{const u=new URL(href,'https://content.invalid/'+chapter.source),p=decodeURIComponent(u.pathname).slice(1);if(p&&!href.startsWith('#'))return{kind:/\.md$/i.test(p)?'reference':'file',path:p}}catch{}
 }
 return{kind:'unavailable',path:href};
}
export const headingId=(text:string)=>text.toLowerCase().trim().replace(/[^\p{L}\p{N}\s_-]/gu,'').replace(/\s+/g,'-');
