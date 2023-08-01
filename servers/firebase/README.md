## Firestoreをlocalで立てるテスト

### firebase-cliのインストール

https://firebase.google.com/docs/cli

```bash
curl -sL https://firebase.tools | bash
```

### 起動

ma-platform-localというプロジェクトIDで起動。

```bash
firebase emulators:start --project ma-platform-local
```

#### dumpからimportする場合

```bash
gsutil cp -r gs://ma-platform-dev-tmp/foo/* ./dump
# 起動
firebase emulators:start --project ma-platform-local --import=./dump
# 終了時にデータを保持しておきたい場合にはこっち
firebase emulators:start --project ma-platform-local --import=./dump --export-on-exit
```

### 内容の確認

[localhost:4000](http://localhost:4000)

### DocumentをSet/Getするテスト

#### node,yarnのinstall

https://nodejs.org/en/download/package-manager/#windows (windows)

https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable

#### 実行

```bash
node test.js
```

### このレポジトリについて

基本 `firebase init` を行なっただけだが、firebase.jsonの中身だけ以下を追加した。

```
  "emulators": {
    "firestore": {
      "host": "0.0.0.0",
      "port": 8080
    }
  }
```
