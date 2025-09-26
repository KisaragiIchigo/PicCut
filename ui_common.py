import os, sys
from PySide6.QtCore import Qt, QPoint
from PySide6.QtGui import QColor, QIcon
from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel, QGraphicsDropShadowEffect

# ===== 設計定数 =====
UI_FONT_FAMILY   = "メイリオ"
PRIMARY_COLOR    = "#4169e1"   # 強調色（ボタン/選択時など）
HOVER_COLOR      = "#7000e0"
TITLE_COLOR      = "#FFFFFF"
WINDOW_BG        = "rgba(255,255,255,0)"
GLASS_BG         = "rgba(5,5,51,200)"
GLASS_BORDER     = "3px solid rgba(65,105,255,255)"
PADDING_CARD     = 16
GAP_DEFAULT      = 10
RESIZE_MARGIN    = 8

def build_qss(compact: bool = False) -> str:
    glass_grad = (
        "qlineargradient(x1:0,y1:0,x2:0,y2:1,"
        "stop:0 rgba(255,255,255,50), stop:0.5 rgba(200,220,255,25), stop:1 rgba(255,255,255,8))"
    )
    bg_image = "none" if compact else glass_grad
    return f"""
    QWidget#bgRoot {{ background-color:{WINDOW_BG}; border-radius:18px; }}
    QWidget#glassRoot {{
        background-color:{GLASS_BG}; border:{GLASS_BORDER}; border-radius:16px;
        background-image:{bg_image}; background-repeat:no-repeat;
    }}
    QLabel#titleLabel {{ color:{TITLE_COLOR}; font-weight:bold; }}

    /* ====== 入力系（右パネル） ====== */
    .DarkPanel * {{ color:#FFF; }}
    .DarkPanel QComboBox, .DarkPanel QSpinBox {{
        background:#e0ffff;              /* ← プルダウン“閉じてる時”の背景色 */
        color:#111;
        border:1px solid #888;
        border-radius:6px;
        padding:3px 6px;
    }}
    .DarkPanel QCheckBox {{ color:#fff; }}

    /* ▼ プルダウン“開いた時の中身”（リストビュー） */
    .DarkPanel QComboBox QAbstractItemView {{
        background:#e0ffff;              /* ← プルダウンのポップアップ背景色 */
        color:#111;                      /* ← 項目のテキスト色 */
        border:1px solid #888;
        outline:none;
        selection-background-color:{PRIMARY_COLOR};  /* ← 選択中の行の背景色 */
        selection-color:#ffffff;         /* ← 選択中の行の文字色 */
    }}
    .DarkPanel QComboBox QAbstractItemView::item {{
        padding:4px 8px;                 /* 行のパディング（見やすさUP） */
    }}

    /* 下矢印エリアの微調整（任意） */
    .DarkPanel QComboBox::drop-down {{
        width:20px;
        border:none;
    }}

    /* ボタン/プログレスなど */
    QPushButton {{
        background:{PRIMARY_COLOR};
        color:white;
        border:none;
        border-radius:8px;
        padding:6px 10px;
    }}
    QPushButton:hover {{ background:{HOVER_COLOR}; }}
    QProgressBar {{
        border:1px solid #555;
        border-radius:5px;
        text-align:center;
        background:#333;
        color:white;
    }}
    QProgressBar::chunk {{ background:{PRIMARY_COLOR}; border-radius:5px; }}
    #textPanel {{ background:#333; color:#ffe4e1; border-radius:10px; padding:8px; }}
    """

def apply_drop_shadow(widget: QWidget) -> QGraphicsDropShadowEffect:
    """#説明: 立体感のためのドロップシャドウ"""
    eff = QGraphicsDropShadowEffect(widget)
    eff.setBlurRadius(28); eff.setOffset(0, 3)
    c = QColor(0,0,0); c.setAlphaF(0.18); eff.setColor(c)
    widget.setGraphicsEffect(eff)
    return eff

class BaseDialog(QWidget):
    """#説明: フレームレス + 半透明カード（ドラッグ移動可）"""
    def __init__(self, title_text: str, parent: QWidget | None = None) -> None:
        super().__init__(parent, Qt.Window | Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setWindowTitle(title_text)

        from PySide6.QtWidgets import QVBoxLayout  # 遅延importで軽量化
        outer = QVBoxLayout(self); outer.setContentsMargins(0,0,0,0)
        bg = QWidget(); bg.setObjectName("bgRoot"); outer.addWidget(bg)
        from PySide6.QtWidgets import QVBoxLayout as _V
        lay = _V(bg); lay.setContentsMargins(GAP_DEFAULT,GAP_DEFAULT,GAP_DEFAULT,GAP_DEFAULT)
        card = QWidget(); card.setObjectName("glassRoot"); lay.addWidget(card)
        self.shadow = apply_drop_shadow(card)

        v = _V(card); v.setContentsMargins(PADDING_CARD,PADDING_CARD,PADDING_CARD,PADDING_CARD)
        title = QLabel(title_text); title.setObjectName("titleLabel"); v.addWidget(title)
        self.card_layout = v

        self._moving=False; self._drag_offset=QPoint()
        self.setStyleSheet(build_qss(False))
        self.resize(720, 480)

    # --- ドラッグ移動 ---
    def mousePressEvent(self, e):
        if e.button()==Qt.LeftButton:
            self._moving=True
            self._drag_offset = e.globalPosition().toPoint() - self.frameGeometry().topLeft()
    def mouseMoveEvent(self, e):
        if self._moving and (e.buttons() & Qt.LeftButton):
            self.move(e.globalPosition().toPoint() - self._drag_offset)
    def mouseReleaseEvent(self, e): self._moving=False

def try_icon(self_widget: QWidget, filename: str = "piccut.ico") -> None:
    """#説明: PyInstaller --onefile 同梱アイコンを安全に適用"""
    path = filename
    if hasattr(sys, "_MEIPASS"):
        path = os.path.join(sys._MEIPASS, filename)
    if os.path.exists(path):
        self_widget.setWindowIcon(QIcon(path))
