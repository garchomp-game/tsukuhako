# 公開データを読みながら学ぶ

1. dev起動中にpage.tsxの「公開カタログを読む」を変更し、保存後の自動反映を確かめます。アプリは書込み機能を持ちません。
2. lib/catalog.tsのselect列とSQLのtableを比べます。不要な列を取得しない理由を説明します。
3. 専用学習プロジェクトで新しい公開列descriptionを追加する場合、変更SQLを新しいファイルとして残します。取得列、Product型、形式検証、表示、テストの順に更新します。本番やS2のCRUD用migrationを使いません。
4. tests/permissions.sqlを読み、anonのSELECTは2件、非公開行は0件、grantの不足によるI/U/D拒否を確認します。さらに試験transaction内だけで書込みgrantを与えてもRLSが拒否することを確かめます。最後のrollbackで試験中の一時grantは残りません。
5. サンプルを削除する場合はpage.tsx・lib/catalog.ts・関連テストを自分の用途へ置き換えます。書込みやAuthが必要なら、所有者ごとのアクセス制御を別仕様として設計します。
