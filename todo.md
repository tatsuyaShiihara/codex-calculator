# TODO（メモ）

最初の目標: S3 にこの電卓（`index.html`, `app.js`, `style.css`）を配置して公開する。

## S3 への配置（最短ルート）

前提:
- AWS アカウント、`awscli v2` がローカルに導入済み
- `aws configure` 済み（`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `region`）
- これは「最短で動かすため」の公開バケット構成（HTTPS/独自ドメインは後述）

手順:
1) バケットを作成（リージョンは任意）
   ```bash
   aws s3 mb s3://<your-bucket-name> --region <region>
   ```
2) 静的ウェブサイトホスティングを有効化（インデックス/エラードキュメント）
   ```bash
   aws s3 website s3://<your-bucket-name> --index-document index.html --error-document index.html
   ```
3) バケットポリシーで公開を許可（最小権限）
   - 事前に「パブリックアクセスをすべてブロック」を必要な範囲で無効化
   - ポリシー例（`<your-bucket-name>` を置換）
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Sid": "AllowPublicReadForWebsite",
           "Effect": "Allow",
           "Principal": "*",
           "Action": ["s3:GetObject"],
           "Resource": "arn:aws:s3:::<your-bucket-name>/*"
         }
       ]
     }
     ```
   - 反映コマンド（`policy.json` に保存した場合）
     ```bash
     aws s3api put-bucket-policy --bucket <your-bucket-name> --policy file://policy.json
     ```
4) ファイルをアップロード
   ```bash
   aws s3 sync . s3://<your-bucket-name> \
     --delete \
     --exclude ".git/*" \
     --exclude "docs/*" \
     --exclude "*.md"
   ```
5) 動作確認
   - ウェブサイト URL: `http://<your-bucket-name>.s3-website-<region>.amazonaws.com`

補足:
- HTTPS と独自ドメインが必要なら、下記の CloudFront 構成を推奨（S3 を非公開のまま配信）。

## 推奨構成（CloudFront + OAC + 独自ドメイン/HTTPS）

- 概要: S3 バケットは非公開、CloudFront の OAC（Origin Access Control）からのみ参照。ACM 証明書で HTTPS、Route53 で独自ドメイン。
- ラフ手順:
  - S3 バケット作成（公開ブロックは有効のまま）
  - CloudFront ディストリビューション作成（オリジンを当該 S3、OAC を有効化）
  - S3 側に CloudFront からのアクセスのみ許可するバケットポリシーを設定
  - ACM で証明書発行 → CloudFront に割当
  - Route53 で `A` レコード（ALIAS）を CloudFront に向ける
  - キャッシュ無効化コマンド例
    ```bash
    aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
    ```

## デプロイの自動化（任意）

- GitHub Actions で `main` への push で S3 に同期
- 例: `aws s3 sync ./ s3://<your-bucket-name> --delete`
- 環境変数は OIDC か GitHub Secrets（`AWS_ROLE_TO_ASSUME`, `AWS_REGION` など）で安全に注入

## そのほかのやりたいこと（メモ）

- PWA 対応（オフラインでも使える電卓）
- 主要ブラウザ/モバイルでの UI 最適化
- アクセシビリティ改善（キーボード操作、スクリーンリーダー対応）
- 計算履歴の保存（`localStorage`）とクリア機能
- 単体テストの追加（演算ロジックの検証）
- 解析用の軽量トラッキング（エラー収集など、同意ベース）

---

メモ更新ルール:
- 小さく刻んで追記。完了したら日付付きで「済」を付ける。
- 外部公開まわり（S3/CloudFront/Route53）は費用に注意（無料枠/料金を確認）。
