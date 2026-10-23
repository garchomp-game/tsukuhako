import path from 'node:path';
export const root = path.resolve(import.meta.dirname, '../..');
export const productVersion = '0.4.4';
export const guideRevision = '2026-10-25-r2';
export const packageRevision = '2026-10-25-b1';
export const applicationSourceCommit = '2b141f7c583d796e1ba75ad312c6ab199056c7de';
export const guideDirectory = path.join(root, 'docs/launch/sunday-pack');
export const selectionFile = path.join(root, 'validation/release-0.4.4-followup/delivery/upload-files.json');
export const guides = [
  {file:'START_HERE.md', id:'start', label:'入口と準備'},
  {file:'FIRST-RUN.md', id:'first-run', label:'F2の初回手順'},
  {file:'TROUBLESHOOTING.md', id:'troubleshooting', label:'困ったとき・再開'},
  {file:'NEXT-STEP.md', id:'next-step', label:'任意：変更と復元'},
  {file:'FEEDBACK.md', id:'feedback', label:'記録票'},
];
export const platforms = {
  linux:{label:'Linux x64', binary:'tsukuhako-linux-x64-0.4.4.tar.gz', scope:'Linux Mint 22.3 x64の既存開発環境で、F2の初期準備・表示・変更・復元・再開を確認しています。未準備PCや他のLinuxは未確認です。', prerequisites:'Docker EngineとCompose、VS Code、MicrosoftのDev Containers拡張が必要です。'},
  windows:{label:'Windows x64', binary:'tsukuhako-windows-x64-0.4.4-setup.exe', scope:'Windows 11通常ユーザー・実WSL/F2は未確認です。未署名exeのServer 2022 CIによる補助確認は、Windows 11実機の確認とは異なります。検証協力用の候補です。', prerequisites:'WSL 2の通常ユーザー、同じWSLへのDocker Desktop連携、Windows側のVS Code、MicrosoftのWSL・Dev Containers拡張が必要です。'},
};
