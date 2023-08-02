# MA-PLATFORM-API

Backend における API 中核部。

およびそれと連携する Frontend などのための開発用の接続環境。

## 構成

選定理由など詳細は別項にて記述。

- Language... [Typescript](https://www.typescriptlang.org) (w/ [ESLint](https://github.com/eslint/eslint))
- Framework... [Nest.js](https://github.com/nestjs/nest) on [Fastify](https://github.com/fastify/fastify) ([Fastify-Adapter](https://docs.nestjs.com/techniques/performance))
  - Logger... [Winston](https://github.com/winstonjs/winston)
  - ORM & migration... [TypeORM](https://github.com/typeorm/typeorm) （予定）
  - I18N... [nestjs-i18n](https://github.com/ToonvanStrijp/nestjs-i18n)
  - Error Handler... [Nestjs - Exception filter (default)](https://docs.nestjs.com/exception-filters)
  - Command line tools
    - Scaffolding... [Nest CLI](https://docs.nestjs.com/cli/overview)
    - Custom... [Nest Commander](https://docs.nestjs.com/recipes/nest-commander) ([GitHub](https://github.com/jmcdo29/nest-commander))
  - Validation... [Ajv](https://github.com/ajv-validator/ajv)
  - Middleware... [Nestjs - Middleware (default)](https://docs.nestjs.com/middleware)
- Firebase Authentication
- Firebase Firestore（半廃止予定）
- MySQL（導入予定）
- Docker & Docker Compose
- Kubernetes

### 構成 - レイヤー

![overview.png](./docs/images/overview.png)

## Getting Started (完全 Docker 化でやりたい場合)

こちらの項目を行えば開発 PC に yarn を入れる必要がなく、node の version なども影響しない環境が作れる。ただし、

- 初回の起動は yarn コマンドを Docker 内で叩く都合上、恐ろしく時間がかかる（10 分〜）
- リソースの更新の際には中身をビルドし直す必要がある
- 間違えて開発サーバのビルドをホストマシン側で行った時おかしくなる可能性がある（node_modules の中は Linux 向けで構成され、ビルドはホストマシン側で行うことになってしまう）

よって当項目の内容で（特にこのレポジトリの開発用に）起動するのはあまり推奨しない。内容は以下へ分ける。

[Local 向け - 完全 Docker 化の場合の設定](./docs/local-docker.md) （node や yarn を開発 PC に入れたくない場合はこちら。Docker のみで完結する。）

## Getting Started (推奨)

Docker for Mac のディスクマウントが遅い関係上、API サーバ本体の開発（ビルド）はホストマシン側で行い、Firestore などは Docker で起動する。

### 必要なもの

開発サーバをホスト側で用意する都合上、Docker 以外も必要なものが出てくる。

- [Docker](https://docs.docker.com/get-docker/)
- node.js の環境
- [yarn](https://classic.yarnpkg.com/en/docs/install)

### 初期設定

プロジェクトルートに`.env`が必要。以下で作成する。

```bash
# テンプレートがあるのでコピーする
cp .env.default .env
```

`.env`の`COMPOSE_FILE`の部分を修正する。具体的には指定する docker-compose ファイルのパスを変更することになる。

```
### .env ###

# Change the path for your environment
# COMPOSE_FILE=./tools/virtualization/local/docker-compose.yml
# For API developers on Mac/Win
# 上の方をコメントアウトし、こちらをアンコメント
COMPOSE_FILE=./tools/virtualization/local/docker-compose-wo-api.yml
```

### 起動する対象

- 開発サーバ（ホスト PC 上でリソース監視）

- [Docker] Firebase Emulator（Authorization, Firestore など）

- [Docker] MySQL（予定）

### 起動

Firestore&UI などは、

```bash
# プロジェクトルートで実行。-d オプションはデーモン化。
docker-compose up -d
```

で起動する。リソースを watch した状態で API サーバを起動するには、

```bash
# Nestの資源群があるapiディレクトリへ移動
cd servers/api

# 初回またはライブラリ追加時のみ、nodeのライブラリを入れるために以下を実行
yarn

# 開始
yarn start:dev
```

![starting-dev-server.png](./docs/images/starting-dev-server.png)

## 稼働確認

[http://localhost:4000](http://localhost:4000) にて、Firebase Emulator のコンソールが出れば Emulator の稼働は OK。

![firebase-ui.png](./docs/images/firebase-ui.png)

API サーバへの疎通確認は[swagger の UI](http://localhost:3000/specs/)を用いるか、curl で以下のように確認できる。

```bash
$ curl -X GET localhost:3000/api/samples/hello
{"message":"Hello World!","pjt":"ma-platform-local"}
```

## 終了

```bash
# プロジェクトルートで実行
docker-compose down
```

## テストデータの注入
ローカルでテストデータを追加するには以下のリポジトリを参照してください。

[db-migration-tools](https://bitbucket.org/mp-asia/db-migration-tools/src/master/)

## アカウント作成

ユーザの作成については`/api/auth/signup`のAPIを使うか、Firebase-UIで手動で作成することができる。

### Signup APIを用いる場合

Swaggerから該当のAPIを叩けば良いが、localでは送信用のメールを作っていないので、サーバログで確認する必要がある。

![verification-link.png](./docs/images/verification-link.png)

なお、`docker-compose up -d`でデーモン化している場合については、`servers/api/api.log`か、あるいは`docker-compose logs -f`でサーバログを監視しておく必要がある。

### 自分のアカウントを作成して、認証を通す

`http://localhost:4000/`にアクセスした後、Authentication emulator の画面へ移動する。その後、右上の Add user から自身の名前/メールアドレス/パスワードを入力し、Save をクリックする。

認証が通るかどうかは、Swagger から`/api/auth/signin`でリクエストボディを投げて確認することができる。

```json
# requestBody
{
  "email": "tanaka@test.com",
  "password": "hogehoge"
}
```

## 開発

### VSCode

VSCode を使っている場合は Extension として ESLint(`dbaeumer.vscode-eslint`)を入れること（初回起動時に Recommendation として出るはず）。他には以下の Extension など推奨。

- EditorConfig for VS Code (`editorconfig.editorc`)
  - ソースコードを開いた時に自動でインデントを判定してくれたり、ファイル保存時に指定したルールに合うように微妙に調整してくれたりする。
- change-case (`wmaurer.change-case`)
  - 対象の文字列を選択して Command Palette を出して、例えば`change case camel`と入力して出てきたものを選択すれば、camel case になる、など。

### Swagger

![swagger.png](./docs/images/swagger.png)

Swagger を導入しており、以下のリンクでテストや API 一覧の閲覧など可能。

[localhost:3000/specs/](http://localhost:3000/specs/)

sample 系以外の API を叩く場合には、（認証が必要なため）最初に Firebase Emulator 側でアカウントを作っておき、ログイン用 API である`/api/auth/signin`を一度実行すること。これで Cookie に認証情報が入るので、認証の必要な API も実行できるようになる。

### コーディングスタンダード

本レポジトリの API の実装におけるルールを以下で定める。

#### 実装というより記述レベルのルールについて

基本的に ESLint の定義内容に則った形式で記述すること。

ESLint 側で修正可能な内容については、以下のコマンドで自動修正させることができる（内部的には`eslint ... --fix`が走る）。

```bash
yarn lint
```

#### レイヤーについて

```
（Middleware）
-> Validation ... Controllerの最初に実行する部分。APIで受け取ったデータの検証。
-> Controller ... ***Controllerという名称のやつ。API定義と受け取ったデータ処理。
-> Service ... ***Serviceという名称のやつ。DBへの問い合わせを行う。
-> Persistence ... DBに対するトランザクションの中で実行されるコード
（-> DBなど）
```

上記のように機能を分けている。ただ、**上記は概念としてこのような機能順序になっている、という意味**で、実際コード上で見ると、

```typescript
// FooController
@Post(':id')
async createFoo(@Param('id') id: string, @Body() dto: FooRequest) {
  // +++++ Validationレイヤー（データ検証） +++++
  // もしここでデータがルールに沿っていなかった場合、例外が投げられる。
  await ValidationUtil.validate(dto, {
    // validationのルール
  }
  // +++++ Controllerレイヤー +++++
  // 何か上記のデータについて処理が必要なら記述
  const barResult = await this.fooService.getBar(id, dto) // Serviceレイヤーへ
  // ...
  return {
    // ...
  }
}
```

Validation ~ Controller ~ Service の部分は Controller クラスの中でこのように記述している（Validation の呼び出しは Controller の最初で行っている）。また、Service クラスでは、

```typescript
async getBar(id: number, data) {
  // +++++ Serviceレイヤー（データの取得や更新） +++++
  const transactionResult = {}
  // ...
  // +++++ Persistenceレイヤー（大量データの取得/整合性を保持した永続化） +++++
  await this.db.runTransaction(async tran => {
    const fooSnapshot = await this.db.collection('foo')
      .doc(id)
      .get()
    // ...
  }
  // ...
}
```

このように Persistence レイヤーを別のクラスに切り出さず、Service クラスの中で記述している。

また、Validation レイヤーは送られてくる Request-Body が無い場合には入れる必要はなく。Persistence レイヤーは必ずしも必要ではない。ただし、以下に注意する。

- サービスレイヤー内で受け取ったデータはすでに検証が行われていることを前提としている。
- サービスレイヤー内では、そこで更新される内容について（どこでエラーが発生したとしても）整合性が保たれるようにする必要がある（transaction を用いる）。
- サービスレイヤーにおける大量データの問い合わせは同一の transaction の中で行うこと（ただし 2-3 に別れる程度には問題ない）。
- また、transaction の中で transaction を貼らないこと。transaction の中で実行されることを前提とした関数は、private にした上で、それがそのように使われることを明示すること（2022/02/18 現在、コメントに`[Persistence]`と入れている）

また、validation は Controller 内で複数回呼び出してもよい（Body 以外にもクエリパラメータなどの検証が入る可能性があるため）。
Controller から複数の Service の関数を呼び出してもよいし、Service-to-Service の呼び出しも可能とするが、トランザクションレベルでのデータの整合性には注意すること。

#### ディレクトリ構成

それぞれのディレクトリに入れる機能群は以下のように定める。

##### servers/api/src/app/

```
app/
├── controllers/   コントローラクラス（@Controller）
|   └── dto/       RequestBodyのマッピング。主にSwagger向けの型定義
├── services/      サービスクラス（外部データリソース問い合わせの@Injectable）
├── providers/     上記以外の@Injectable
├── models/        外部データへのマッピング用（ORM用など）
├── middlewares/   Controllerへ至る前にデータの処理が必要な場合に用いる
├── exceptions/    例外系
|   ├── errors/    カスタム例外定義
|   └── handlers/  Error Handler（@Catch, ExceptionFilter）
├── utils          その他の便利ツール
└── modules        モジュール（@Module）
```

##### servers/api/src/

```
src/
├── app/             アプリそのものの動作コード群
├── commands/        カスタムのコマンド系モジュール
├── resources/       その他静的資源
├── config/          全体の設定系資源
├── database/        アプリとは別に実行されるDB処理系
|   ├── migrations/  DBのマイグレーションファイル
|   └── seeders/     DBに入れる初期情報とその実行機能群
├── main.ts          アプリの起動起点
└── command.ts       コマンドの起動起点
```

##### servers/api/

```
api/
├── env/             各種環境の設定ファイル
|   ├── .env.local
|   ├── .env.local-docker      （Dockerのみで動かす場合の設定）
|   ├── .env.dev
|   ├── .env.dev.secret    （.gitignoreされている）
|   ├── .env.staging
|   ├── .env.staging.secret    （.gitignoreされている）
|   ├── .env.production
|   └── .env.production.secret （.gitignoreされている）
├── src/             主要な開発資源
├── test/            単体/結合テスト用
├── dist/            ビルド時に作成される動作スクリプト群（.gitignoreされている）
├── .env             環境設定（.gitignoreされている。自分で作る必要があるので注意）
├── .eslintrc.cjs    Typescriptのlint設定
├── tsconfig.json    Typescriptにおけるビルド上の設定ファイル
└── package.json
```

#### エラー定義

例外発生時に返す Request Body の共通の仕様を以下のように定義する（`exceptions/handlers/` で共通に定義している。）。

```json
{
  "message": "エラーメッセージ（特に表示用などではなく、ちょっとした判別用）",
  "translated": "ここの内容は画面表示に用いる（I18N対応）",
  "code": "判別用エラーコード。例: E-XXX-XXX-XXX-001",
  "errors": null
}
```

最後の`errors`の部分は Validation エラー(status code `422`)など、複数の原因が発生した際に入れる。Validation の場合の例としては、

```json
{
  "message": "unprocessable_entity",
  "translated": "不正な値です",
  "code": null,
  "errors": [
    {
      "param": "email",
      "type": "format",
      "values": { "format": "email" },
      "message": "must match format \"email\"",
      "translated": "メールアドレスはメールアドレスの形式で入力してください"
    }
  ]
}
```

このように、`errors`の配列の中に個別に`translated`という内容が含まれるので、それを画面側に出すようにする。

翻訳文面の内容は `resources/locales/{言語コード}/errors.json` などで定義する内容を引っ張ってきている。

また、Coded 系の Exception に対するエラーコードの定義は、

```
E - クラス(サービスやコントローラの略称) - 種別(同一エラー種別) - 関数名(エラー箇所識別) - 番号(関数内箇所識別)
```

とし、`種別`まで（例: `E-SUS-ABC`）でエラー種別の判定と翻訳用の引き当て、その後の`関数名`と`番号`でエラーの発生箇所がわかるようにしておく（4XX 系エラーは画面側責任なので特にサーバサイドでエラーダンプや通知を行わないが、問い合わせが来たときや現場のオペレーションの円滑化のためにエラー原因は特定できるようにする必要がある）。

ネーミングルールは、例えば

`Error / UsersService / InvalidID / createUser / 002`

に対して、

`Error-ServiceUSer-InvalidID-CreateUSer-002`

を縮めて（クラス名や関数名など実装の中身を画面側でわからないようにしておく）、

`E-SUS-IID-CUS-002`

など。サービスクラスやコントローラクラス内で統一が取れるようにしておけばそれでいい。

#### API 設計

一般的な RESTful-API の仕様に沿った形に実装する。使いやすいように多少のカスタム性を持たせて、以下のようなルールを持たせる。

##### Method

- GET... データ取得。単なる取得で、Side-Effect をもたらさない。

- POST... データ追加または検索（「検索を追加する」という意味合い）。

  - 検索系の API においてはリクエスト内容が複雑になる可能性があり、クエリパラメータで要求するのは若干危険なため。また、検索系は`/search`という形で URL を切り分けるようにしている。

- PUT... データ更新。

- DELETE... データ削除。論理削除（削除フラグを入れるだけ）の場合もある。

##### URL

`/api/`で初め（これは ApiModule に定義された Controller にて自動で付与される）、それに引き続いて `親リソース > 親ID > 子リソース > 子ID > ...`のような形で定義する。取得内容に種別が必要になった場合かつその機能性が単なる取得の場合と大きく異なる場合には末尾に種別を指定する。

なお、`me`は自身のユーザ ID の代わりで、リクエストの認証情報から送信者の情報を判別して自身に関する情報を操作する。

例:

GET `/api/users/`→ ユーザ一覧を取得する。

GET `/api/users/me`→ 自身の詳細情報を取得する。

GET: `/api/users/123/orders/` → ユーザ(ID=123)の全ての注文内容を取得する。

GET: `/api/users/123/orders/987654/` → ユーザ(ID=123)の注文番号 987654 の内容を取得する。

POST: `/api/users/123/orders/` → ユーザ(ID=123)の注文を追加する。

PUT: `/api/users/123/orders/987654/` → ユーザ(ID=123)の注文番号 987654 の内容を訂正する。

DELETE: `/api/users/123/orders/987654/`→ ユーザ(ID=123)の注文番号 987654 の内容を削除する。

POST: `/api/users/123/orders/search` → ユーザ(ID=123)の注文内容を検索する。

GET: `/api/users/123/orders/processing/` → ユーザ(ID=123)の注文の内、処理中のものについてその処理状況など詳細情報込みで取得する。

##### 返答データ

Response の内容は、画面側で用いやすいように、また、少しの機能の違いで大量の API を実装する必要が無いように、ある程度汎用的な内容として実装する。このため、GET 要求のあったリソースに対する副次的な情報もある程度含むように実装する。

例: `/api/items/{item_id}`

NG

```json
{
  "item": {
    "id": "rONYD10bDf9U4JsSH8em",
    "name": "テストアイテム",
    ...
    "user_id": "nF9bHG8TSJun1PQiz37p"
  }
}
```

OK

```json
{
  "item": {
    "id": "rONYD10bDf9U4JsSH8em",
    "name": "テストアイテム",
    ...
    "user": {
      "id": "nF9bHG8TSJun1PQiz37p",
      "name": "Satoshi",
      "sex": 1
    }
  }
}
```

あまり周辺データを含めすぎるとパフォーマンスに影響が出るが、特に検索系 API などを除けばそこまで大量の情報が必要になるケースは希で、一般的にはなるべく必要な情報を一緒に含めた方が良い。画面側では大抵の場合において、表示のために対象のデータに対する周辺の情報を必要とする。仮に現行の仕様でいらなかったとしても、今後の改修で必要になるというケースは多く、API の再設計にならないように、なるべく一緒に含めるような設計にした方がよい。

##### 日付のフォーマット

Request/Response に日付情報を含める際には、[ISO8601(RFC3339)](https://datatracker.ietf.org/doc/rfc3339/)の共通形式にすること。具体的には`YYYY-MM-DDTHH:mm:ss.SSSZ`の形式にする（ただし millisecond の部分は必ずしも必要なく、locale の Z の部分は GMT 以外にも`+HH:mm`が使える）。

例:

```
2022-01-23T12:34:56.543Z
2022-01-23T03:34:56+09:00
```

##### ネーミングルール

- API パス、ファイル名... `kebab-case`
- クラス名... `PascalCase`
- 関数・変数名... `camelCase`
  - （メンバ変数含むが、マッピング用の Model や DTO については以下の系統なので除外）
- API のパラメータ、DB 上のエンティティやそのフィールド名... `snake_case`

##### タグ名の命名規則

Swaggerで表示されるタグ名の命名は[webAPI仕様書]に準拠する。Swagger画面上でのAPIの検索性向上のためにタグをつけているという事情を鑑み、タグ名の命名規則は以下のとおりとする。

- 全てのタグは単数系で表す。
- ユーザー自身の情報を扱うものは `user`タグを用いる
- ユーザー○○系となっているものは、`user_related`タグを用いる
- カテゴリ数が少ないもの(1~2個)に関しては`others`タグを用いる(user-relatedの対象となるものは除く)

### 開発環境

- servers/api/env/.env.dev.secret (Git にコミットできないビルド上の機密情報)

## 構成 - 選定理由など

### Language - Typescript

- 現開発チームのスキルセット的に Backend への参画がしやすい。
- 利用するフレームワークやその周辺ツールの充実性が許容範囲内であると判断できた。
- 既存の Backend の機能群が Javascript で作られていたため、移植がしやすい。

上記の理由による。詳細は Framework の項目で述べる。

### Framework - Nest.js

あまり肯定的な理由では無いが、「他に良さそうな Typescript のフレームワークが無かったから」選定となった。対抗案としては、Micro Framework を含め、Javascript/Typescript で

- [Express.js](https://github.com/expressjs/express)（Javascript - Micro）
- [Koa.js](https://github.com/koajs/koa)（Javascript - Micro）
- [Next.js](https://github.com/vercel/next.js)（Javascript/Typescript, 通常 Front 向けだがコミュニティが大きく、一応 Micro Framework レベルでの機能サポートがある）
- [Marble.js](https://github.com/marblejs/marble)（Typescript - コミュニティ規模が小さい）
- [Hapi.js](https://github.com/hapijs/hapi)（Javascript）
- [Restify.js](https://github.com/restify/node-restify)（Javascript）

など。コミュニティ規模が小さい、一緒に用いる周辺ライブラリの選定が難しい（標準で使える機能が少ない）など、あまり良いフレームワークが見つからなかった。Express を用いるのも手だが、今回の開発チームの体制としては縛りを強化した方が安全と考え、Typescript かつそこそこの機能がある Nest を選定した。

なお Javascript/Typescript 以外の言語で考えれば、Laravel（PHP）や RubyOnRails（Ruby）などのフルスタックのフレームワークを用いる方がずっと安全ではあるが、最初に述べたスキルセットやチームの状態を重視した。

### Nest.js の周辺ツールについて

標準的に用意されている機能や公式の Doc にあるプラグインなどで対応できなかったものについて述べる。

#### Logger - Winston

これは単に、「標準の Logger においては機能が不十分」「GCP の Cloud Logging への対応を考える必要がある」などの点から、Server-Side Javascript の方面で良く使われる[Winston](https://github.com/winstonjs/winston)を導入した。ログのフォーマットの調整やコンソール出力/ファイル出力などの設定の調整が行いやすい。

#### I18N - nestjs-i18n

これは公式推奨のものがなく、苦し紛れなところも大きい。できれば[i18n-node](https://github.com/mashpie/i18n-node)を用いたかったところだが、これ自体は Express 向けに作られており、Request-Header から Locale を直接抜き出して直接の Locale 設定などを行って Nest 向けに使おうとしたが、うまく行かなくて断念した。[nestjs-i18n](https://github.com/ToonvanStrijp/nestjs-i18n)を一旦導入して対応することにする。

#### Nest Commander

これ自体は公式のもの。Nest アプリのリソース群に親和性のある実行トリガを自作するのは大変なので、これをベースとしてカスタムのコマンド（例えばアプリケーション本体とは別に実行する Migration や Seeder など）を作る。

`command.ts`が起点。


#### Validation

公式では class-validator を推奨しているが、これ自体は内部で Request を受け取ることができず、Validation の結果を Localize（国際化）することができないため却下。また、Decorator での Validation 指定では柔軟な対応が取りづらいという問題もあった。[Ajv](https://github.com/ajv-validator/ajv)を代わりに導入し、対象の Request オブジェクトに対する Validation-Schema を作って Validation を行うようにする（[Ajv の仕様](https://ajv.js.org/json-schema.html)）。ただ、国際化対応においては標準のエラーメッセージの違和感が強く分かりづらいため、結果の国際化自体は専用の Util を作り対処する。
