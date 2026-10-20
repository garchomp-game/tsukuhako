import type {Preparation, Curriculum, Reading} from './types';

export function withDistro(reading:Reading, id:string):Reading {
  return {...reading, distroId:id || undefined};
}

export function selectDistro(distros: NonNullable<Preparation['distros']>, current?: string) {
  if (distros.some(d => d.id === current)) return current!;
  return distros.length === 1 ? distros[0].id : '';
}

export function helpChapter(index: Curriculum, id: string) {
  const lesson = index.lessons.find(l => l.id === id);
  const chapter = lesson?.chapters.find(c => ['recovery', 'troubleshooting', 'trouble'].includes(c.id));
  return chapter ? {lessonId: id, chapterId: chapter.id} : {lessonId: 'setup', chapterId: 'trouble'};
}
