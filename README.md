# KOTTO ARCHIVES — 琴山しずく 活動記録アーカイブ

RAY・琴山しずくさんの活動記録（イベント出演／楽曲／ディスコグラフィー／メディア発信）をまとめた静的Webサイトです。

- 公開URL（GitHub Pages）: https://hamaboh.github.io/kotto_Archives/
- ビルド不要。HTML / CSS / JavaScript のみで動作します。
- ホスティング費用: **0円**（GitHub Pages / Public リポジトリ）

---

## 1. ページ構成

```
index.html          トップページ（メニュー・統計）
├─ history.html     沿革（イベント・楽曲・音源・メディアを日付順に統合した年表）
├─ events.html      イベント出演情報（年別フィルタ＋キーワード検索）
├─ songs.html       楽曲情報（オリジナル楽曲／初披露／カバー曲の披露形態）
├─ discography.html ディスコグラフィー（作品と収録楽曲）
└─ media.html       メディア（#コットクラブ ほか）
```

## 2. ファイル構成

```
.
├── index.html / history.html / events.html / songs.html / discography.html / media.html
├── assets/
│   ├── style.css      デザイン（配色・レイアウト）
│   └── app.js         共通スクリプト（ヘッダー/フッター生成・各ページ描画）
├── data/              ★ 内容の編集はここだけで完結します
│   ├── events.js      イベント出演記録
│   ├── songs.js       オリジナル楽曲・カバー楽曲・披露形態・披露回数
│   ├── discography.js 音源作品
│   └── media.js       メディア発信記録
├── images/            写真置き場（現在は空）
└── .nojekyll          GitHub Pages の Jekyll 処理を無効化
```

`data/*.js` は先頭の `window.KOTTO_XXX = ` 以降が JSON です。GitHub のWeb画面（ファイルを開いて鉛筆アイコン）から直接編集できます。

## 3. 写真の追加方法

1. 画像ファイルを `images/` にアップロードします（例: `images/2023-09-09_kottone.jpg`）。
2. `data/events.js`（または `discography.js`）の該当項目の `"images": []` に追記します。

```json
"images": [
  { "src": "images/2023-09-09_kottone.jpg", "caption": "琴山しずく生誕「KOTTONE」" },
  { "src": "images/2023-09-09_kottone_2.jpg", "caption": "" }
]
```

`"images": []` のままなら写真欄は表示されません。ファイル名は半角英数字を推奨します。

## 4. 披露回数の集計ルール

`data/songs.js` の `formats[].count`（披露回数）は、`data/events.js` の各イベントの `details` から自動集計した値をそのまま保持しています。集計時の判断基準は次のとおりです。

- セットリストは「披露形態の見出し」の配下にある項目として数えます。見出しとして扱う表記：
  `歌唱` / `歌唱（…）` / `生誕パート（カバー曲歌唱披露）` / `琴山しずく弾き語り` /
  `琴山しずく生誕バンド「コットリアン」` / `DJ琴山しずく` / `琴山しずく TECHNO SET` / `hypermoshkotto`
- `（Remix）` `（hypermoshkotto ver.）` `（合唱）` は原曲に合算します。
  ただし `Wall of Death（Remix）` `Wall of Death Beat Up` `Wall of Death Beat Up & Up` は独立した楽曲として扱います。
- 披露形態そのものは Notion の「楽曲×活動形態」データベースとイベント記録の和集合です。
  データベース上は披露済みでもイベント側にセットリストの記録がない場合、回数は「記録なし」と表示されます。

数値を直接直したい場合は `data/songs.js` の `count` を書き換えてください（サイトはこの値をそのまま表示します）。

## 5. 記録の追加・修正

`data/events.js` の1件のフォーマット:

```json
{
  "id": "e20260923-xxxx",              // 重複しない任意のID（アンカーに使用）
  "date": "2026-09-23",                // YYYY-MM-DD
  "year": 2026,
  "title": "RAYワンマンライブ",
  "venue": "渋谷 Veats SHIBUYA",
  "links": [{ "label": "URL", "url": "https://..." }],
  "details": [                          // level = 入れ子の深さ（1が最上位）
    { "level": 1, "text": "トピック：", "links": [] },
    { "level": 2, "text": "RAY卒業", "links": [] }
  ],
  "note": "",                           // 補足・要確認事項があれば
  "images": []
}
```

編集後にコミットすれば、数十秒〜数分で公開サイトに反映されます。

## 6. デプロイ（GitHub Pages）

1. GitHub リポジトリの **Settings → Pages** を開く
2. **Source** を `Deploy from a branch`、**Branch** を `main` / `/ (root)` に設定して Save
3. 数分後 `https://hamaboh.github.io/kotto_Archives/` で公開されます

独自ドメインを使う場合のみ、ドメイン取得費（年1,000〜2,000円程度）が別途必要です。使わなければ費用は0円のまま運用できます。

## 7. ローカルでの確認

`index.html` をブラウザで直接開くだけで確認できます（データを `.js` 形式にしているため、ローカルサーバーは不要です）。

## 8. 出典

Notion「KOTTO_GRADUATION」に整理された記録を元にデータ化しています。

---

本サイトはファンによる非公式のアーカイブです。
