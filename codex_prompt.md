# App.tsx リファクタリング指示

## 目的

これはプレゼン用の最小限のデモである。デザインやレイアウトの完成度は高くないほうが先方に誤解を与えづらい。
見た目を整える作業は不要。既存のスタイルはそのまま維持し、ロジックのみを変更する。

現状の問題は演出が複雑すぎて「自分の選択が結果を変えている」ことが
直感的に伝わりにくい点にある。各設問と変化の対応を1対1で明確にし、
過剰なアニメーションとグラデーション演出を削除することが唯一の目標。

---

## 変更方針の概要

| 設問 | 変化する要素 | 変化の内容 |
|---|---|---|
| Q1（得意） | アイコン | 選択肢に対応したSVGに切り替わる |
| Q2（関わり方） | 色 | blue↔pinkのグラデーションで変化 |
| Q3（場） | 大きさ | アイコンのサイズが連続的に変化 |

---

## 詳細変更内容

### 1. Q1 — アイコンの切り替え

動的なSVG（clip-pathによる形変化）を廃止し、
`/public/images/` に配置した静的SVGファイルに差し替える。

**選択肢とSVGファイルの対応：**

| key | label | SVGファイル |
|---|---|---|
| create | 作る／描く | /images/01.svg |
| story | 物語を書く | /images/02.svg |
| connect | 人をつなぐ | /images/03.svg |
| build | 組み立てる | /images/04.svg |
| spread | 広める | /images/05.svg |

**実装方針：**
- Q1未選択時はアイコンエリアを空またはプレースホルダー（薄い円）で表示
- 選択時にアイコンがフェードイン（opacity 0→1、duration 200ms程度）するだけでよい
- SVGの塗り色（#231815）はCSSで上書きし、現在のテーマカラー（--tone）に合わせる
  - `img`タグではなく`<svg>`をインラインで埋め込むか、CSSフィルターで色を変える
- トランジションは最小限。過剰なアニメーション不要

---

### 2. Q2 — 色だけが変わる

現状のmixColor（blue→pink）は残すが、
**q2が影響するのは色のみ**に限定する。

**残すCSS変数：**
- `--tone`（メインカラー）
- `--tone-soft`（ソフトカラー）
- `--tone-deep`（背景深色）

**削除するq2連動の挙動：**
- `pulseDurationMs`（アニメーション速度変化）
- `--pulse-rotate`（回転変化）
- `--pulse-radius`（radius変化）

---

### 3. Q3 — 大きさだけが変わる

アイコン表示エリアのサイズをq3の値で連続的に変化させる。

**実装方針：**
- サイズ = `80 + q3 * 80` px（最小80px、最大160px）
- widthとheightの両方に適用
- transitionは `width 0.3s ease, height 0.3s ease` 程度でよい

---

### 4. NavCharコンポーネントの変更

現状の`NavChar`コンポーネント（clip-pathによるSVG形状アニメーション）を
**アイコン表示コンポーネント**に置き換える。

新しいコンポーネントのprops：
```tsx
type IconDisplayProps = {
  iconSrc: string | null  // SVGファイルのパス。nullの場合はプレースホルダー表示
  size: number            // px単位のサイズ（q3から算出）
  color: string           // 現在のテーマカラー（--tone）
}
```

---

## 削除してよいもの

以下はすべて削除する：

**stateおよびuseEffect：**
- `pulseDrift` state
- `setPulseDrift` 関連のuseEffect（ランダム回転アニメーション）
- `isDraggingQ2`、`isDraggingQ3` は残してよい

**CSS変数の算出ロジック：**
- `pulseDurationMs` の算出
- `pulseStyle` useMemo
- `pulseShellStyle` useMemo

**削除するCSS変数：**
- `--pulse-duration`
- `--pulse-scale-start` / `--pulse-scale-mid` / `--pulse-scale-peak`
- `--pulse-rotate`
- `--pulse-shadow`
- `--pulse-radius`
- `--pulse-opacity`
- `--pulse-drift` / `--pulse-drift-duration`

**型・定数：**
- `Q1Option` 型の `points` フィールド
- `NEUTRAL_POINTS` 定数
- `navPoints`、`navClipPath` の算出ロジック

---

## 残すもの

- Q1の選択肢5つ（key・labelのみ。pointsは不要）
- q2によるmixColor（色変化）
- q3によるサイズ変化（新規追加）
- `dynamicStyle` の `--tone`、`--tone-soft`、`--tone-deep`、`--q2`、`--q3`、`--ui-radius`
- スクロール導線（sectionRefs、scrollToSection、IntersectionObserver）
- `whiteTransition` state と関連するuseEffect・CSS変数
- ミニマップ、ヘッダー
- セクション0〜8のコンテンツ（JSX構造）

---

## フィードバックセクション（section 4）への追記

`選択は、見え方を変えます` のセクションに、
3つの変化をまとめて見せるサマリー表示を追加する。

```tsx
<div className="feedback-summary">
  <div className="feedback-item">
    <span className="feedback-label">得意</span>
    {/* 選択されたアイコンを小さく表示 */}
    <img src={selectedIconSrc} width={40} height={40} />
  </div>
  <div className="feedback-item">
    <span className="feedback-label">関わり方</span>
    {/* --toneカラーの丸 */}
    <div className="feedback-color-dot" />
  </div>
  <div className="feedback-item">
    <span className="feedback-label">場</span>
    {/* q3の値を視覚化（小さい丸〜大きい丸） */}
    <div className="feedback-size-dot" />
  </div>
</div>
```

スタイルは既存のデザイントーンに合わせてシンプルに実装する。

---

## デザイン簡略化の方針

以下の過剰な演出は削除・簡略化する：

- グラデーション背景のアニメーション → 静的なグラデーションに変更
- パルス・スケールアニメーション → 削除
- ランダムドリフト回転 → 削除
- 複数のCSS変数が絡み合う複雑な演出 → 上記の3変数（色・形・大きさ）のみに整理

ただし以下は残す：
- `--white-transition`（スクロールに応じた背景色変化）
- q2による色変化（--tone系）
- セクション間のスクロールフェード

---

## 補足

このモックは「自分の選択がデザインを変える」という体験を
プレゼンで説明するための最小限のデモである。
技術的な完成度より、変化が一目でわかることを優先する。

---

## 追加タスク：配布資料のHTML化

### 概要

提案書マークダウン（別途添付）を `/public/doc/index.html` として配置し、
`http://e6.hithot.design/doc/` でアクセスできるようにする。

モックのメインURLは `http://e6.hithot.design/`（既存のReactアプリ）。
配布資料は `/public/doc/index.html` として静的HTMLで配置する。
Reactのルーティングには手を加えない。

### ファイル構成

```
/public/
  doc/
    index.html   ← 提案書HTML（単一ファイルで完結させる）
```

### デザイン方針

- CSSは `<style>` タグでHTMLに埋め込む（外部ファイル不要）
- フォントは Google Fonts の Noto Sans JP を `<link>` タグで読み込む
- 配色はモックのトーンに合わせる
  - 背景: #1a0f2e
  - テキスト: #ffffff（本文）/ #cccccc（サブ）/ #888888（注釈）
  - アクセント: #7b9cff（blue）/ #ff4d8f（pink）
  - カード背景: #1e1530
  - ボーダー: #2a1f4a
- 本文フォントサイズ: 15px、行間: 1.8
- 最大幅: 800px、中央揃え、左右パディング: 24px

### コンテンツ構造

マークダウンの見出し階層に対応させる：

- `#`（h1）→ ページタイトル（大きめ、中央揃え）
- `##`（h2）→ セクション見出し（上部にblue→pinkグラデーションライン 1px）
- `###`（h3）→ サブ見出し（accent blue）
- テーブル → スタイル付きテーブル（ヘッダーにaccent blue、行交互背景）
- 太字 → white + font-weight 500
- 箇条書き → 左に `—`（accent blue）をインジケーターとして配置
- 水平線 `---` → セクション区切り線（border-color）

### ナビゲーション

- ページ右上に固定の目次（5セクション）
- スムーズスクロールで各セクションへ移動
- `@media print` でナビを非表示にする

### フッター

```html
<footer>
  <a href="/">← モックに戻る</a>
</footer>
```

### 注意事項

- JavaScriptは最小限（スムーズスクロールのみ）
- 外部リソースはGoogle Fontsのみ。他の外部依存は持たない
- 単一HTMLファイルで完結させる

---

## 全体の補足

モックのメインURL（`/`）とドキュメントURL（`/doc/`）を同一ドメイン上に置くことで、
プレゼン中・後に体験と資料を行き来しやすくする。

配布資料はプレゼン前に先方リーダーへ事前共有し、
プレゼン当日はモックを実際に触ってもらった上で資料を参照するという使い方を想定している。

技術的な完成度より「変化が一目でわかること」「資料がすぐ読めること」を優先する。
