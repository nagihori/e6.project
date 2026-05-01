# プレゼン用 擬似UI

ブラウザで表示するための静的モック画面です。  
Vite + React + TypeScript で構成しており、Vercelでそのままビルド可能です。

## 技術選定

- Vite: ビルドが高速で、静的配信向けの構成がシンプル
- React: 画面部品の再利用がしやすく、今後の拡張に対応しやすい
- TypeScript: UI改修時の型安全性を確保
- Vercel: Git連携デプロイが簡単で、Viteプロジェクトとの相性が良い

## ローカル起動

```bash
npm install
npm run dev
```

## 本番ビルド確認

```bash
npm run build
npm run preview
```

## Vercel デプロイ

`vercel.json` を同梱済みです。  
Vercelでプロジェクトをインポートすれば、以下設定でビルドされます。

- Build Command: `npm run build`
- Output Directory: `dist`

## パスワード保護

Basic認証ではなく、`Vercel Middleware + API + HttpOnly Cookie` でサイト全体を保護する構成を追加しています。  
未認証のアクセスは `/unlock.html` にリダイレクトされ、正しいパスワード入力後に全ページへ入れます。

Vercel の Environment Variables に以下を設定してください。

- `SITE_PASSWORD`: 共有するパスワード
- `SITE_AUTH_SECRET`: Cookie署名用の長いランダム文字列
- `SITE_PASSWORD_SHA256`: 任意。平文パスワードの代わりにSHA-256ハッシュを使いたい場合のみ設定

ローカル用サンプルは `.env.example` に入れています。
