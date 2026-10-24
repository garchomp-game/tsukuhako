import type {Preparation, Curriculum, Reading, Created} from './types';

export function withDistro(reading:Reading, id:string):Reading {
  return {...reading, distroId:id || undefined};
}

export function selectDistro(distros: NonNullable<Preparation['distros']>, current?: string) {
  if (distros.some(d => d.id === current)) return current!;
  return distros.length === 1 ? distros[0].id : '';
}

export function helpChapter(index: Curriculum, id: string, chapterId?: string) {
  if ((id === 'guide' || chapterId === 'first') && index.lessons.find(l => l.id === 'guide')?.chapters.some(c => c.id === 'troubleshooting')) {
    return {lessonId:'guide', chapterId:'troubleshooting'};
  }
  const lesson = index.lessons.find(l => l.id === id);
  const chapter = lesson?.chapters.find(c => ['recovery', 'troubleshooting', 'trouble'].includes(c.id));
  return chapter ? {lessonId: id, chapterId: chapter.id} : {lessonId: 'setup', chapterId: 'trouble'};
}

// Runtime tools are not prerequisites for writing files. On Windows the helper
// must belong to the exact selected distribution before creation is offered.
export function canCreateFiles(platform?: string, prep?: Preparation, distroId?: string) {
  return platform !== 'win32' || Boolean(distroId && prep?.helperReady && prep.target?.distroId === distroId);
}

export function projectForChapter(project: Created | undefined, reading: Pick<Reading, 'lessonId'|'chapterId'>) {
  return reading.chapterId === 'first' && project?.templateId === reading.lessonId ? project : undefined;
}

export function readerContentKey(reading: Pick<Reading, 'lessonId'|'chapterId'>, project?: Created) {
  const active = projectForChapter(project, reading);
  return JSON.stringify([reading.lessonId, reading.chapterId, active?.destination, active?.guide]);
}

type Check = NonNullable<Preparation['checks']>[number];
const stateLabels:Record<string,string> = {ready:'利用可能',missing:'未導入',stopped:'導入済み・停止中',setup:'設定の確認が必要',restart:'再起動等が必要',unknown:'確認できない'};
export function preparationItem(check:Check, storageTemplateName='メモを保存するWeb画面') {
  const state = check.state;
  const item = {title:'開発環境の確認',purpose:check.reason,state,label:check.label || stateLabels[state] || '確認できない',action:check.nextAction,chapter:check.guide,heading:''};
  if (check.id.startsWith('docker') || check.id === 'compose' || check.id === 'wsl-integration' || check.id === 'engine-compatibility') {
    item.title = check.id === 'compose' ? 'Docker Compose' : 'Docker';
    item.purpose = 'サンプルを動かす環境を用意します。';
    item.heading = 'dockerを使えるようにする';
    item.action = state === 'missing' ? '導入手順を開き、Dockerを用意します。' : state === 'stopped' ? 'Dockerを起動し、もう一度確認します。' : state === 'restart' ? '再起動の案内を確認してから、もう一度確認します。' : state === 'unknown' ? '接続先と実行結果を確認します。未導入かどうかはまだ分かりません。' : '接続先・権限など、必要な設定を確認します。';
  } else if (check.id === 'code') {
    item.title = 'VS Code'; item.purpose = '作ったフォルダーを開き、サンプルを操作します。'; item.heading = 'vs-codeを使えるようにする';
    item.action = state === 'missing' ? '導入手順を開き、VS Codeを用意します。' : 'VS Codeの起動と、アプリから開ける設定を確認します。';
  } else if (check.id.startsWith('ms-vscode-remote.')) {
    item.title = check.id.endsWith('remote-wsl') ? 'VS CodeのWSL機能' : 'VS CodeのDev Containers機能';
    item.purpose = 'VS Codeからサンプルを動かす環境へ接続します。'; item.heading = 'vs-codeへ必要な機能を追加する';
    item.action = state === 'unknown' ? 'VS Codeの拡張機能一覧を確認します。未導入かどうかはまだ分かりません。' : state === 'restart' ? 'VS Codeを再起動する案内を確認してから、もう一度確認します。' : 'VS Codeで必要な拡張機能を確認し、足りなければ追加します。';
  } else if (check.id.startsWith('s2-')) {
    item.title = `${storageTemplateName}の追加準備（${check.id.slice(3)}）`; item.purpose = '保存機能の準備に使う道具です。'; item.heading = 'メモを保存する画面の追加準備'; item.action = '追加準備の手順を開き、この道具の状態を確認します。';
  } else if (check.id === 'template-host-tools') {
    item.title = 'このOSでの起動手順'; item.purpose = 'ファイルの作成と、実際の起動は別に確認します。'; item.action = 'このOSで確認できている範囲を準備手順で読みます。';
  } else if (check.id === 'interrupted') {
    item.title = '中断した診断'; item.action = '確認を再開するには「もう一度確認」を押してください。';
  }
  return item;
}
