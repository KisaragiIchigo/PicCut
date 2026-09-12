# PicCut Ultra ✂️

画像の不要な余白（白・黒・透明アルファ・自動判定した背景色など）を**自動検出**し、一括で高精度にトリミングする次世代デスクトップアプリケーション。

---

## ✨ 主な特長

- **全域ドラッグ＆ドロップ対応**: ウィンドウ内のどこにドロップしても即座にファイル・フォルダを認識して展開。
- **高精度な余白自動検出**:
  - **白背景 / 黒背景検出**
  - **透明（Alpha）余白検出**（WebP/PNGの透過レイヤーを完全保持）
  - **背景色の自動判定**（上下左右それぞれの辺から個別に背景色を求めるため、片側だけ帯の色が異なる画像にも対応）
  - **ノイズ許容の調整**（余白の帯に入り込んだ透かし文字や圧縮ノイズを無視して検出）
  - **許容しきい値（Tolerance）スライダー調整**
  - **トリミング方向の選択**（四方 / 左右のみ / 上下のみ / 左・右・上・下の片側のみ）
- **一括サイズ統一**: 複数枚をまとめて処理するとき、全画像を先に解析して出力サイズを決め、同じ寸法で書き出します。連続したページを扱う際に、余白の多い画像だけ細くなるのを防げます。
  - 余白のある側が画像ごとに異なっていても、**各画像はそれぞれの余白を正しく削った上で**サイズだけが揃います。
  - 揃える相手は**元の寸法が同じ画像どうし**に限られます。表紙と本文のように判型の違うものが同じフォルダに混ざっていても、小さい側が大きい側のサイズに引き伸ばされることはありません。
  - **切り出し位置も揃える**オプション（任意）: 全画像をまったく同じ座標で切り抜きます。同じ判型のページが並ぶ場合の位置ずれ防止に有効です。
  - 統一後の寸法はプレビューに反映され、書き出し前に確認できます。
  - 検出結果はキャッシュされるため、プレビューで解析済みの内容は書き出し時に再利用されます。
- **リアルタイム比較プレビュー**:
  - 検出枠（ネオンシアンのアニメーション破線）のオーバーレイ表示
  - 元画像サイズ・トリミング後サイズ・削減率（%）のリアルタイム表示
  - 統一後のキャンバス範囲のオーバーレイ表示（サイズ統一で余白が足される場合）
  - 拡大・縮小ズーム対応
- **柔軟な余白（マージン）＆出力オプション**:
  - トリミング後の余白追加（% または px）
  - 余白背景色（透過、白、黒、検出した背景色に合わせる）
  - 安全な保存設計（`Remake/` サブフォルダ保存、上書き保存、カスタム出力先）
  - 出力フォーマット変換（元形式維持、PNG、WebP、JPEG）
- **高速マルチスレッド・バッチ処理**: 大量ファイル・重い高解像度画像でもUIが固まらない非同期ワーカー処理と進捗モーダル。
- **設定の自動永続化**: ウィンドウサイズ・位置・各種設定パラメータを自動保存し次回起動時に復元。

---

## 🛠️ 技術スタック

| 分野 | 採用技術 |
| :--- | :--- |
| **UIフレームワーク** | React 18 + TypeScript |
| **ビルドツール** | Vite 6 |
| **スタイリング** | Tailwind CSS v3 + CSS Variables |
| **デザインシステム** | Warm Titanium & Studio Slate (`project_style.json` 準拠) |
| **コンポーネント &amp; アイコン** | Radix UI + Lucide React |
| **アニメーション** | Framer Motion |
| **デスクトップランタイム** | Electron 34 |
| **画像処理エンジン** | Sharp (高速Native画像処理パイプライン) |

---

## 🚀 開発・起動・ビルド方法

### 1. ワンクリック起動
- **`起動.bat`** をダブルクリックするだけで、依存関係のチェックからアプリ（開発モード）の起動まで自動で実行されます。

### 2. ワンクリックコンパイル（Releaseビルド）
- **`コンパイル.bat`** をダブルクリックすると、以下の2種類の Windows 用 EXE を `Release/` フォルダに自動生成し、完了後にフォルダを開きます：
  - **`PicCut_Ultra_Portable.exe`**：インストール不要でどこでも動く単一実行ファイル版
  - **`PicCut_Ultra_Setup_Installer.exe`**：インストーラー版（ショートカット作成対応）

### コマンドライン操作
```bash
# 依存関係インストール
npm install

# 開発モード起動
npm run dev

# コンパイル・パッケージング
npm run build
```

---

## 📁 ディレクトリ構成

```text
PicCut/
├─ src/
│  ├─ main/                    # Electron メインプロセス
│  │  ├─ index.ts              # アプリ起動・ライフサイクル・IPC
│  │  ├─ preload.ts            # 安全な ContextBridge API
│  │  └─ services/
│  │     ├─ imageProcessor.ts  # 画像処理の公開窓口（processing/ と batch/ のバレル）
│  │     ├─ detection.ts       # 余白境界検出・辺ごとの背景色サンプリング
│  │     ├─ detectionCache.ts  # 検出結果の LRU キャッシュ
│  │     ├─ imageSource.ts     # 画像をバッファへ読み込んで sharp へ渡す（上書き保存の衝突回避）
│  │     ├─ configStore.ts     # 設定永続化
│  │     ├─ processing/        # 1枚ぶんの処理パイプライン
│  │     │  ├─ processSingleImage.ts  # 各ステップを順に呼ぶオーケストレータ
│  │     │  ├─ buildCropGeometry.ts   # 切り出し矩形と埋め量の導出（純粋関数）
│  │     │  ├─ applyExtensions.ts     # 統一の埋めと仕上げマージンの付与
│  │     │  ├─ applyOutputFormat.ts   # 出力形式・品質の適用
│  │     │  ├─ outputPath.ts          # 出力パス解決
│  │     │  └─ fileScan.ts            # 対応拡張子・再帰走査
│  │     └─ batch/             # 一括処理
│  │        ├─ BatchProcessor.ts      # 進捗・中止制御のオーケストレータ
│  │        ├─ computeBatchPlan.ts    # 統一プランの算出
│  │        └─ unionOfBoxes.ts        # 矩形の和集合（純粋関数）
│  ├─ renderer/                # React レンダラー (UI)
│  │  ├─ index.html
│  │  ├─ main.tsx
│  │  ├─ index.css
│  │  ├─ App.tsx               # メイン画面オーケストレーション
│  │  ├─ components/           # UIコンポーネント群
│  │  │  ├─ TitleBar.tsx       # カスタムタイトルバー
│  │  │  ├─ DropZone.tsx       # 全域D&D受け入れ
│  │  │  ├─ PreviewCanvas.tsx  # プレビュー・検出枠・統一範囲の表示
│  │  │  ├─ ControlPanel/      # インスペクタ操作パネル
│  │  │  │  ├─ index.tsx                   # 各セクションを並べるオーケストレータ
│  │  │  │  ├─ DetectionColorSection.tsx   # 検出カラー・しきい値
│  │  │  │  ├─ TrimDirectionSection.tsx    # トリミング方向
│  │  │  │  ├─ UnifySizeSection.tsx        # 一括サイズ統一
│  │  │  │  ├─ MarginSection.tsx           # 余白設定
│  │  │  │  ├─ OutputSection.tsx           # 保存・出力形式
│  │  │  │  ├─ QueueListSection.tsx        # 投入リスト
│  │  │  │  ├─ PanelActions.tsx            # 投入・実行ボタン
│  │  │  │  └─ controlStyles.ts            # 共通のクラス定義
│  │  │  ├─ BatchQueueModal.tsx# 一括処理進捗モーダル
│  │  │  └─ ReadmeModal.tsx    # 使い方・ガイド
│  │  ├─ hooks/                # カスタムフック
│  │  │  ├─ useImageProcessor.ts       # 各フックを束ねるオーケストレータ
│  │  │  ├─ imageProcessor/
│  │  │  │  ├─ useImageQueue.ts        # 投入・メタデータ取得・選択
│  │  │  │  ├─ useBoundsDetection.ts   # 選択画像の余白検出
│  │  │  │  ├─ useBatchPlan.ts         # 統一プランの事前算出
│  │  │  │  ├─ useBatchRunner.ts       # 実行・進捗購読・中止
│  │  │  │  └─ buildProcessOptions.ts  # 設定→処理オプション（純粋関数）
│  │  │  └─ useSettings.ts
│  │  └─ utils/                # ユーティリティ
│  │     ├─ colorUtils.ts
│  │     └─ canvasDetection.ts
│  └─ shared/                  # 共通定義
│     ├─ types.ts              # 共通型
│     └─ batchPlan.ts          # 統一プランの参照ヘルパ（純粋関数）
├─ 旧バージョン/               # 旧 Python (PySide6) コード資産一式
├─ project_style.json          # スタイル・カラー単一情報源
├─ changelogs.json             # 変更履歴
├─ package.json
├─ vite.config.ts
└─ README.md
```

---

## 📜 ライセンス

MIT License ©️ 2025-2026 KisaragiIchigo
