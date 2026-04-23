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
