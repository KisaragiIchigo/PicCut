from PySide6.QtWidgets import QWidget, QVBoxLayout, QTextBrowser, QPushButton, QHBoxLayout
from ui_common import BaseDialog, build_qss

README_MD = r"""
# P!Ccut - まとめてトリミング ©️2025 KisaragiIchigo

## 概要
画像の**余白（白/黒）を自動検出**してトリミングし、`Remake/` に保存します。
ドラッグ＆ドロップ（ウィンドウ全域）・進捗バー・フレームレスUIに対応。

## 使い方
1. 画像やフォルダをウィンドウにD&D（どこでもOK）。
2. 右のメニューで「検出カラー」「トリミング方向」を選ぶ。
3. 必要なら「余白を残す(%)」で値を設定。
4. D&Dなら自動開始／ボタンからも実行できます。

"""

class ReadmeDialog(BaseDialog):
    def __init__(self, parent=None):
        super().__init__("README ©️2025 KisaragiIchigo", parent)
        view = QTextBrowser(); view.setObjectName("textPanel")
        view.setOpenExternalLinks(True); view.setMarkdown(README_MD)

        row = QHBoxLayout()
        btn = QPushButton("閉じる"); btn.clicked.connect(self.close)
        row.addStretch(1); row.addWidget(btn)

        self.card_layout.addWidget(view, 1)
        self.card_layout.addLayout(row)
        self.setStyleSheet(build_qss(False))
