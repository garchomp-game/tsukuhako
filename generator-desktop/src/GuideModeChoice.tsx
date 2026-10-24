import type {GuideMode} from './types';

export function GuideModeChoice({value,onChange,id}:{value:GuideMode;onChange:(mode:GuideMode)=>void;id:string}) {
 return <fieldset className="guide-mode"><legend>進め方を選ぶ</legend><div className="mode-options">
  <label><input type="radio" name={id} value="guided" checked={value==='guided'} onChange={()=>onChange('guided')} aria-label="手順を見ながら進める"/><span><strong>手順を見ながら進める</strong><small>説明と確認方法を読みながら進めます。</small></span></label>
  <label><input type="radio" name={id} value="quick" checked={value==='quick'} onChange={()=>onChange('quick')} aria-label="必要な操作だけ進める"/><span><strong>必要な操作だけ進める</strong><small>必要な操作・コマンド・確認結果をまとめます。</small></span></label>
 </div><p className="hint">あとで切り替えられます。作るファイルや接続先は同じです。</p></fieldset>;
}
