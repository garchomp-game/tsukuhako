# ツクハコ 0.4.7 — 0.4.6レビューへの対応

[2026-10-24のレビュー](../../docs/requests/onboarding-046-review-2026-10-24/review.md)で指摘された **V01・V02の修正と再確認を完了**。本人の通常インストール・助言なしの操作は **利用者確認待ち**。レビューに書かれた追加候補は、今回の必須2点と分けて扱った。

## 修正と直接確認

| 指摘・関連条件 | 修正 | 結果と方法 |
| --- | --- | --- |
| V01 / A06 | 正本FIRST-RUNを「開始ボタン→推奨構成選択と準備欄→『保存先を決める』→保存先入力」に訂正。ボタンと表示見出しを明記し教材を再生成 | PASS / 最終debをLinux Mint上で展開起動。オフラインの内蔵ガイドを読み、記載された操作で保存先入力まで進めた。開始直後の推奨選択・準備欄フォーカスも一致 |
| V02 / A07・A09 | 各生成構成に作成前ヘルプを追加。選択構成、保存先入力、内容確認、作成失敗に応じた見出しへ移動。OSの準備リンクを選び、OS未確認時は明示的な選択肢を表示 | PASS / Linuxの推奨Web・SQL・保存機能の3構成を最終debで確認。上部ナビと実エラー内入口、OS準備からの復帰、入力保持を確認。Windowsの同3構成は実レンダラー＋模擬IPCで確認 |
| 生成後の維持 | 今回の保存先・URLを含む案内と、生成後ヘルプからの復帰を保持 | PASS / 最終debで日本語・空白の保存先、非既定ポート38107を使って実生成。保存済みSTART_HERE・画面・ヘルプ往復後の値が一致。既存のコピー、VS Code操作、次の生成、Windows選択WSL条件はfixtureでも再検査 |

生成前の主な案内にサンプル起動・DB復旧コマンドを出さない。構成別の復旧資料は「作成した後」の補助リンクとして残す。SQLはDB初期化を含む章より先に通常のトラブル対処を選ぶ。OS準備章からの「準備チェックへ戻る」は準備欄へフォーカスする。

作成前ヘルプは正本 `docs/desktop-setup/creation.md` から6構成分を生成。既存55章と合わせて61章。ガイドは2026-10-24-r5。既存テンプレートの機能・依存・ZIPは変更していない。関連する未公開の案内原稿の版と章数も合わせ、メール5本はdraftのまま維持した。

## 成果物・履歴

- branch：`codex/onboarding-046-20261024`（既存の作業branchを継続）
- privateリポジトリ：[garchomp-game/tsukuhako](https://github.com/garchomp-game/tsukuhako/tree/codex/onboarding-046-20261024)
- 最終製品のclean build元：`418a00725dc40d686d2f83a177b67566b15b1ce6`
- 原稿は専用worktreeで分担。担当commit `63f988fd57bccf7ac60575d61a11b83ccc66ed1a` を統合。別担当がV02の実装・試験を読み取りレビューし、戻り先フォーカスの指摘も反映。
- 単体deb：`/home/garchomp-game/ダウンロード/ツクハコ-0.4.7-Linux/tsukuhako-linux-amd64-0.4.7.deb`
- サイズ：133,499,948 bytes
- SHA-256：`f83b23cfd45d68ad8ec1d21072b65386e4e66f9d4b69fe82c5d5425eb4f3a43b`
- 同じフォルダーにINSTALL.txt、SHA256SUMS、manifest.json。旧0.4.6配布物は保持。通常利用の0.4.5は更新していない。
- 製品ビルド後のcommitは検証ツールの補完、証拠、レポート等。上記の製品build元と区別する。

## 検証記録

| 方法 | 結果・範囲 | 記録 |
| --- | --- | --- |
| ローカル自動検査 | generator 30/30、desktop 33/33、型検査・UI build PASS | logs/generator-tests.txt、desktop-tests.txt、build.txt |
| STATIC | 61章ハッシュ、279内部リンク、全6構成の生成案内、原稿再生成一致 PASS | logs/content-check.json |
| STATIC | 関連原稿86/86 PASS。未公開・未送信の状態を維持 | logs/launch-content-final.json |
| FIXTURE | 実レンダラーの16シナリオPASS。Linux/Windows×3構成で準備・保存先・確認・生成失敗、両ヘルプ入口と戻りを確認。macOS/OS未確認、390px幅、コピー、VS Code失敗/再試行、次の生成も含む | logs/ui-fixture.json、ui-fixture.txt |
| EXTRACTED_DEB_ON_REAL_HOST | 最終debをLinux Mint上の専用画面で起動。V01、Linuxの3構成のV02、実生成と生成後の復帰 PASS。既存フォルダーによる入力エラーと、確認後に同名フォルダーを作る競合による作成エラーを実際に起こした | final/logs/review-smoke.json |
| BUNDLE / STATIC | 最終debの版・同梱132ファイル・61章・7テンプレート・helper整合、独立cwd/日本語パス、欠落/改ざん拒否 PASS。fixtureのレンダラー4ファイルは最終deb内とSHA一致 | final/logs/deb-inspection.json、stage.json、packaging-tests.txt、helper-archive.json、renderer-fixture-match.json |
| ローカル配布コピー | Downloadsへコピーしたサイズ・SHAが最終debと一致 | final/logs/delivery.json |
| CI | この作業branchのGitHub Actions履歴は0件。CI成功とは扱わない | push時にghで確認 |

実機の操作は自動操作であり、初心者本人の成功ではない。0.4.7の通常導入・メニュー起動、Dev Container起動からサンプル表示・停止再開までの一巡、インストーラーの更新/削除/再導入は今回NOT_RUN。後二者は0.4.6の過去の証拠として残し、0.4.7の結果へ読み替えない。今回の変更箇所は、上表の最終debで直接再確認した。

検証時に見つけて直した版定数・検査側の期待値・fixture章不足などは [検証補足](logs/verification-notes.md)に記録。元の0.4.6レポートにも後続レビューで判明した不整合を追記した。原本の依頼資料はバイトを保持し、SHAをprovenance.jsonに記録している。

## 画面

- [修正した内蔵初回ガイド](final/screenshots/01-corrected-first-guide.png)
- [開始直後の準備欄](final/screenshots/02-start-preparation.png) → [保存先入力](final/screenshots/03-destination.png)
- [SQLを選択した生成前ヘルプ・Linux実物](final/screenshots/04-I1-preparation-help.png)
- [SQLを選択した生成前ヘルプ・Windows模擬](screenshots/windows-sql-creation-help-fixture.png)
- [保存機能の作成エラー時のヘルプ](final/screenshots/05-S2-generation-error-help.png)
- [実生成後の保存先とURL](final/screenshots/06-current-project.png)

検証用アプリ・専用デスクトップは終了済み。生成ファイルは保持し、新たな開発用コンテナーは起動していない。他プロジェクトの稼働コンテナー2件と通常インストール0.4.5は維持した（final/logs/cleanup.json）。

## 未確認・次の操作

通常のツクハコを閉じ、上記0.4.7のdebを開いて更新する。メニューから起動して版を確認し、ガイドを見ながら新規作成からサンプル表示まで試す。本人の操作は **利用者確認待ち**。

Windows実機、macOS実機、未準備PC、一般購入者の受取は未確認。公開・実メール送信・課金・main統合は行っていない。

レビュー末尾の保存MD→SETUP.mdのLinux見出し直リンクは追加候補として残した。現状の全テンプレートには対応するLinux見出しがなく、実施には原稿・生成リンク・テンプレート版・ZIPの改訂が必要。V01/V02の必須修正とは分けている。
