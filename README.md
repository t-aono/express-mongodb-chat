# express-mongodb-chat
Express, MongoDB を使ってシンプルなチャットアプリ

## 機能
パスワード認証 / サインアップ / 記事の投稿・一覧表示 / 画像アップロード

## 使用技術
Express / MongoDB / Passport / Pug / Less

## デモ

![oVmjKzUaxS528YZteWQM1658482103-1658482127](https://user-images.githubusercontent.com/46856574/180410278-55ad7491-3604-485d-a008-5fb2db4f3a10.gif)

## ローカルでの動作方法

事前に MongoDB をインストールしておく必要があります。

ローカルの MongoDB 起動
```
npm run db
```

ローカルサーバー起動
```
npm run serve
```

Less のコンパイル
```
lessc less/app.less css/app.css
```

