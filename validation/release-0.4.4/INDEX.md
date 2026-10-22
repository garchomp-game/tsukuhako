# 0.4.4 証跡の入口

最初に読むもの：[REPORT.md](REPORT.md)。作業開始時の計画と合否条件は [PLAN.md](PLAN.md)。

| 確認 | 種類 | 証拠 |
|---|---|---|
| OS別配布パック | STATIC | [Linux案内](delivery/linux/START_HERE.txt) / [manifest](delivery/linux/manifest.json) / [SHA256SUMS](delivery/linux/SHA256SUMS)、[Windows案内](delivery/windows/START_HERE.txt) / [manifest](delivery/windows/manifest.json) / [SHA256SUMS](delivery/windows/SHA256SUMS) |
| 別パスの受取検査・同梱資材 | STATIC | [Linux](logs/linux-delivery.json)、[Windows](logs/windows-delivery.json) / [payload](logs/windows-payload.json) / [helper](logs/windows-helper.json)、[最終4ファイル照合](logs/delivery-checks.json) |
| 実際のCI・取得経路 | CI / STATIC | [run結果](logs/ci-run.json)、[artifactサイズ・期限](logs/ci-artifacts.json)、[private権限](logs/repository-access.json)、[未決事項とupload下書き](DELIVERY.md) |
| Reader変更前 | REAL_HOST（0.4.3） | [広幅](screenshots/UX-before-wide.png) / [狭幅](screenshots/UX-before-narrow.png) / [200%](screenshots/UX-before-200percent.png)、[測定](logs/reader-before.json) |
| Reader変更後 | REAL_HOST（最終0.4.4） | [広幅](screenshots/UX-after-wide.png) / [狭幅](screenshots/UX-after-narrow.png) / [200%](screenshots/UX-after-200percent.png)、[目次](screenshots/UX-after-toc-open.png) / [本文末尾](screenshots/UX-after-chapter-end.png) / [再開](screenshots/UX-after-restart.png)、[11グループ結果](logs/reader-final.json) |
| 引数なし通常起動 | REAL_HOST | [ログ](logs/normal-launch.json)、[教材のネイティブ拡大](screenshots/UX-normal-no-debug.png) |
| F2生成→起動→編集→復元→再開 | REAL_HOST | [Linuxの順序・環境・全画像](LINUX.md)、[操作記録](logs/linux-steps.ndjson)、[後片付け](logs/cleanup.json) |
| Windows最終exeの導入・起動・削除・保持 | CI | [installer-smoke](logs/windows-installer-smoke.json)、[renderer](logs/windows-renderer.json)、[教材画面](screenshots/Windows-installed-lesson.png)、[権限・対象範囲](WINDOWS.md) |
| CI初回：登録名照合FAIL | CI | [attempt 1](logs/windows-attempt-1.json)、[run](https://github.com/garchomp-game/tsukuhako/actions/runs/39693763993) |
| CI2回目：削除待ちFAIL | CI | [attempt 2](logs/windows-attempt-2.json)、[run](https://github.com/garchomp-game/tsukuhako/actions/runs/39694317532) |
| CI3回目：修正後PASS（中間ソース） | CI | [attempt 3](logs/windows-attempt-3.json)、[run](https://github.com/garchomp-game/tsukuhako/actions/runs/39694945848)。最終配布は4回目のみ |
| 既存回帰51件・ビルド | STATIC / FIXTURE、最終ソースでもCI再実行 | [27 core](logs/core-tests.log) / [23 desktop](logs/desktop-tests.log) / [1 package](logs/package-tests.log) / [renderer build](logs/renderer-build.log)、[最終CI](logs/ci-run.json) |
| 同梱Nodeとhelper | STATIC / FIXTURE | [archive検査](logs/helper-archive.json)、[6構成生成等](logs/helper-linux-tests.json) / [中断・終了](logs/helper-shutdown.json)。Linux runtimeは実行、WSL名/停止用コマンドは模擬。Windows transportはNOT_RUN |
| 本人・協力者の残り | NOT_RUN | [5〜10分で試す範囲](TRY-5-10-MIN.md)、[Windows実機の最小手順](WINDOWS-TRIAL.md) |

大容量の配布物・展開フォルダ・trace・依存ファイルはruns/およびdist/に置き、Gitには入れません。Git内のdelivery/には証跡用の小さい3ファイルだけがあり、実際に渡す4ファイルはREPORT記載の最終フォルダまたはActionsから取得します。
