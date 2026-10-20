# 停止・再構築・初期化

通常の終了はホストで `bash scripts/project.sh stop`、再開は `bash scripts/project.sh start` です。ソースファイルも DB の行も残ります。`down` はこのコピーのコンテナとネットワークを削除し、DB volume は保持します。

作業コンテナの設定を変えた場合は VS Code の **Dev Containers: Rebuild Container** を使います。Compose のみなら `bash scripts/project.sh rebuild` です。DB の named volume とホスト側ソースは保持されます。再構築後は Reopen in Container でつなぎ直し、`bash scripts/db.sh doctor` と SELECT で自分の変更が残ることを確認します。

## このコピーの DB を空に戻す

これはデータを消す操作です。必要な SQL や取得結果を別ファイルへ保存してから実行します。ソースコードと migration ファイルは削除されません。

1. ホストで `bash scripts/project.sh resources` を実行し、このコピーの project と `<project>_pgdata` を確認します。
2. 出力にある project をそのまま確認文字列にします。例の数字を自分の識別子へ置き換えてください。

   ```bash
   bash scripts/project.sh reset --confirm otoka-i1-123456789
   ```

3. このコピーのコンテナを停止・削除し、所有ラベルが一致した DB volume だけを削除します。別コピーの volume とホスト全体の Docker 資源は対象外です。
4. 空の DB を作り、保存済み migration と seed を適用します。

   ```bash
   bash scripts/project.sh start
   bash scripts/project.sh db setup
   bash scripts/project.sh db check
   ```

`reset` を確認文字列なし、または別コピーの文字列で実行すると停止します。volume の所有ラベルが一致しない場合も停止します。`docker system prune` や volume の一括削除はこの手順にはありません。

`.env` のパスワードを編集しても、既存 DB のパスワードは自動変更されません。消したくないデータがある場合は `.env` の元の値を戻します。識別子を書き換えて既存 DB を探し直す操作はしないでください。
