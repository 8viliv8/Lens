# UREI / ATELIER

個人のアプリ作品棚。公開先: https://8viliv8.github.io/Lens/atelier/

## 更新方法

- 画面の「新しい作品」「詳細・編集」で追加・修正できます。保存先は操作中のブラウザのlocalStorageです。公開一覧や他端末には自動反映されません。
- 「データを書き出す」でJSONをバックアップできます。「読み込む」はIDが同じ作品を更新し、その他の既存作品を残します。
- 公開一覧を更新するときは `data.js` の `window.ATELIER_WORKS` にJSON配列を設定し、GitHubの `Lens/atelier/` に反映してください。空のURLは未登録として表示されます。
- 公開GitHub Pagesです。ログイン制限はありません。秘密のURL、アクセスキー、私的メモは公開ファイルに入れないでください。
- 各カードの画像はこのポータル用の抽象図案で、アプリのスクリーンショットではありません。

## データ

`id` は固定の一意な文字列。`title`, `description`, `category`, `status`, `url`, `tags`, `note`, `art` を持ちます。カテゴリは写真／映像・光／音／ツール／実験、進捗は公開中／制作中／構想／要確認。進捗が確認できない作品には架空の完成率を付けていません。

## 確認した資料 (2026-10-16)

- Lensの現行mainとGitHub Pages設定。NOIR、横濱寫眞の公開URLはHTTP 200。
- LUXURY 1912: observation-console/luxury1912/ の公開HTMLを確認。XY signal instrument。
- 「Build ConSentinel HTMLおしゃれなサイト作成」の会話から参照元を回収。
- The Plane of Focus: https://sael.net/plane-of-focus/ — 焦点面・操作と空間の連動を参考に、独自の点群・半透明面を実装。コード・素材の転載はしていません。
- Spring Ramble: https://spring-ramble.kelly-1df.workers.dev/ — 元の会話にある空間・最小限HUDの説明を参考にしました。今回のWeb取得では本体を確認できませんでした。
- 「映写機制作 WebGL作品」「横濱寫眞アプリ」の会話を確認。映写機の完成物URLは取得できていません。
- WASH-INK・urei-shareは過去の制作記録を参考に登録。現行の公開状況は未確認です。
- APP DECK・粒子写真アプリは依頼の作品名から仮登録。別作品との同一性を推測してURLを紐付けていません。

## 実装

ビルド不要のHTML/CSS/JavaScript。WebGLが使えない場合はCSSの光の彫刻が残ります。動きの停止ボタン・OSの動きを減らす設定に対応。フォントはGoogle Fonts、取得できない場合は端末のフォントに切り替わります。
