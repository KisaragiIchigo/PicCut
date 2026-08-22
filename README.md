# PicCut Ultra ✂️

画像の不要な余白（白・黒・透明アルファ・四隅近似色など）を**自動検出**し、一括で高精度にトリミングする次世代デスクトップアプリケーション。

---

## ✨ 主な特長

- **全域ドラッグ＆ドロップ対応**: ウィンドウ内のどこにドロップしても即座にファイル・フォルダを認識して展開。
- **高精度な余白自動検出**:
  - **白背景 / 黒背景検出**
  - **透明（Alpha）余白検出**（WebP/PNGの透過レイヤーを完全保持）
  - **四隅自動サンプリング**（角の背景色を自動判定）
  - **許容しきい値（Tolerance）スライダー調整**
- **リアルタイム比較プレビュー**:
  - 検出枠（ネオンシアンのアニメーション破線）のオーバーレイ表示
  - 元画像サイズ・トリミング後サイズ・削減率（%）のリアルタイム表示
  - Before / After スプリット比較スライダー
  - 拡大・縮小ズーム対応
- **柔軟な余白（マージン）＆出力オプション**:
  - トリミング後の余白追加（% または px）
  - 余白背景色（透過、白、黒）
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
│  │     ├─ imageProcessor.ts  # Sharp 画像処理エンジン・バッチ処理
│  │     └─ configStore.ts     # 設定永続化
│  ├─ renderer/                # React レンダラー (UI)
│  │  ├─ index.html
│  │  ├─ main.tsx
│  │  ├─ index.css
│  │  ├─ App.tsx               # メイン画面オーケストレーション
│  │  ├─ components/           # UIコンポーネント群
│  │  │  ├─ TitleBar.tsx       # カスタムタイトルバー
│  │  │  ├─ DropZone.tsx       # 全域D&D受け入れ
│  │  │  ├─ PreviewCanvas.tsx  # プレビュー・検出枠・スプリット比較
│  │  │  ├─ ControlPanel.tsx   # インスペクタ操作パネル
│  │  │  ├─ BatchQueueModal.tsx# 一括処理進捗モーダル
│  │  │  └─ ReadmeModal.tsx    # 使い方・ガイド
│  │  ├─ hooks/                # カスタムフック
│  │  │  ├─ useImageProcessor.ts
│  │  │  └─ useSettings.ts
│  │  └─ utils/                # ユーティリティ
│  │     ├─ colorUtils.ts
│  │     └─ canvasDetection.ts
│  └─ shared/                  # 共通型定義
│     └─ types.ts
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
