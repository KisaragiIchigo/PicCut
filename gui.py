# gui.py
# メインGUI（PySide6）©️2025 KisaragiIchigo
import os
from typing import List, Optional
from PySide6.QtCore import Qt, QEvent, QPoint, QThread, Signal, QObject
from PySide6.QtGui import QPixmap, QImage, QPainter, QPen, QColor
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QComboBox,
    QCheckBox, QSpinBox, QFileDialog, QMessageBox, QProgressBar
)

from ui_common import (
    build_qss, apply_drop_shadow, PADDING_CARD, GAP_DEFAULT, RESIZE_MARGIN, try_icon
)
from processor import detect_whitespace, process_targets, _rgb_for_detection, SUPPORTED_EXTS
from readme import ReadmeDialog
from PIL import Image
from config import load_settings, save_settings, AppSettings

# ===== 非同期ワーカー =====
class WorkerSignals(QObject):
    progress = Signal(int, int)      # done, total
    finished = Signal(list)          # errors
    error = Signal(str)

class WorkerThread(QThread):
    def __init__(self, inputs: List[str], color_type: str, direction: str, keep_margin_percent: int):
        super().__init__()
        self.inputs = inputs
        self.color_type = color_type
        self.direction = direction
        self.keep_margin_percent = keep_margin_percent
        self.signals = WorkerSignals()
        self._cancel = False

    def cancel(self): self._cancel = True

    def run(self):
        try:
            errs = process_targets(
                self.inputs,
                color_type=self.color_type,
                direction=self.direction,
                keep_margin_percent=self.keep_margin_percent,
                progress_cb=self.signals.progress.emit,
                is_cancelled=lambda: self._cancel
            )
            self.signals.finished.emit(errs)
        except Exception as e:
            self.signals.error.emit(str(e))

# ===== メインウィンドウ =====
class MainWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("P!Ccut - まとめてトリミング ©️2025 KisaragiIchigo")
        self.resize(1000, 660)
        self.setMinimumSize(900, 600)
        self.setWindowFlags(Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        try_icon(self, "piccut.ico")

        # 全域D&D
        self.setAcceptDrops(True)

        # 設定ロード
        self.cfg: AppSettings = load_settings()

        # === 外枠/カード ===
        outer = QVBoxLayout(self); outer.setContentsMargins(0,0,0,0)
        bg = QWidget(); bg.setObjectName("bgRoot"); outer.addWidget(bg)
        bgL = QVBoxLayout(bg); bgL.setContentsMargins(GAP_DEFAULT,GAP_DEFAULT,GAP_DEFAULT,GAP_DEFAULT)
        card = QWidget(); card.setObjectName("glassRoot"); bgL.addWidget(card)
        self.shadow = apply_drop_shadow(card)
        root = QVBoxLayout(card); root.setContentsMargins(PADDING_CARD,PADDING_CARD,PADDING_CARD,PADDING_CARD); root.setSpacing(GAP_DEFAULT)

        # === タイトルバー ===
        title_bar = QHBoxLayout()
        self.btn_readme = QPushButton("📘 README"); self.btn_readme.setFixedHeight(28); self.btn_readme.clicked.connect(self._show_readme)
        self.title = QLabel("P!Ccut - まとめてトリミング"); self.title.setObjectName("titleLabel")
        title_bar.addWidget(self.btn_readme)
        title_bar.addSpacing(6)
        title_bar.addWidget(self.title)
        title_bar.addStretch(1)
        self.btn_min = QPushButton("🗕"); self.btn_min.setFixedSize(28,28)
        self.btn_max = QPushButton("🗖"); self.btn_max.setFixedSize(28,28)
        self.btn_close = QPushButton("ｘ"); self.btn_close.setFixedSize(28,28)
        self.btn_min.clicked.connect(self.showMinimized)
        self.btn_max.clicked.connect(lambda: self.showNormal() if self.isMaximized() else self.showMaximized())
        self.btn_close.clicked.connect(self.close)
        title_bar.addWidget(self.btn_min); title_bar.addWidget(self.btn_max); title_bar.addWidget(self.btn_close)
        root.addLayout(title_bar)

        # === メイン 2カラム ===
        main = QHBoxLayout(); main.setSpacing(GAP_DEFAULT)
        root.addLayout(main, 1)

        # 左: プレビュー
        self.preview = QLabel("プレビュー（1枚時）"); self.preview.setMinimumSize(400, 400)
        self.preview.setStyleSheet("background:#222; color:#aaa; border:1px solid #444;")
        self.preview.setAlignment(Qt.AlignCenter)
        main.addWidget(self.preview, 1)

        # 右: メニュー（縦積み）
        side = QWidget(); side.setProperty("class", "DarkPanel")
        sideL = QVBoxLayout(side); sideL.setContentsMargins(12,12,12,12); sideL.setSpacing(10)

        # 検出カラー（プルダウン）
        self.combo_color = QComboBox()
        self.combo_color.addItems(["白背景検出", "黒背景検出"])
        self.combo_color.setCurrentIndex(0 if self.cfg.color_type=="white" else 1)
        sideL.addWidget(QLabel("検出カラー")); sideL.addWidget(self.combo_color)

        # トリミング方向（プルダウン）
        self.combo_dir = QComboBox()
        self.combo_dir.addItems(["左右", "上下", "両方"])
        self.combo_dir.setCurrentIndex({"horizontal":0,"vertical":1,"both":2}[self.cfg.direction])
        sideL.addWidget(QLabel("トリミング方向")); sideL.addWidget(self.combo_dir)

        # 余白を残す
        self.chk_margin = QCheckBox("余白を残す")
        self.chk_margin.setChecked(self.cfg.keep_margin_checked)
        self.spin_margin = QSpinBox(); self.spin_margin.setRange(0,50); self.spin_margin.setValue(self.cfg.keep_margin_percent)
        sideL.addWidget(self.chk_margin); sideL.addWidget(self.spin_margin)
        # ▼ 空白スペースを入れる（伸縮しない固定の隙間）
        sideL.addSpacing(50)   # ← 好きな高さに調整
        # 選択ボタン
        self.btn_pick_imgs = QPushButton("画像選択")
        self.btn_pick_imgs.clicked.connect(self._pick_files)
        self.btn_pick_dir  = QPushButton("フォルダ選択")
        self.btn_pick_dir.clicked.connect(self._pick_dir)
        sideL.addWidget(self.btn_pick_imgs)
        sideL.addWidget(self.btn_pick_dir)

        # 進捗＆制御
        self.progress = QProgressBar()
        self.btn_cancel = QPushButton("中止"); self.btn_cancel.setEnabled(False); self.btn_cancel.clicked.connect(self._cancel_worker)
        self.btn_start  = QPushButton("処理開始"); self.btn_start.clicked.connect(self._start_from_pending)
        sideL.addWidget(self.progress)
        sideL.addWidget(self.btn_cancel)
        sideL.addWidget(self.btn_start)

        sideL.addStretch(1)
        main.addWidget(side)

        # フレームレス移動/リサイズ
        self._moving=False; self._drag_offset=QPoint()
        self._resizing=False; self._edges=""; self._start_geo=None; self._start_mouse=None

        # スタイル適用
        self.setStyleSheet(build_qss(self.isMaximized()))

        # ウィンドウ位置/サイズ復元
        if self.cfg.win_w>0 and self.cfg.win_h>0:
            self.resize(self.cfg.win_w, self.cfg.win_h)
        if self.cfg.win_x>=0 and self.cfg.win_y>=0:
            self.move(self.cfg.win_x, self.cfg.win_y)
        if self.cfg.maximized:
            self.showMaximized()

        # 値変更でプレビュー更新
        self.combo_color.currentIndexChanged.connect(self._update_preview_if_any)
        self.combo_dir.currentIndexChanged.connect(self._update_preview_if_any)
        self.chk_margin.toggled.connect(self._update_preview_if_any)
        self.spin_margin.valueChanged.connect(self._update_preview_if_any)

        self.worker: WorkerThread | None = None
        self.pending_inputs: List[str] = []
        self._preview_buf: Optional[bytes] = None
        self._last_preview_path: Optional[str] = None

    # ====== D&D（全域） ======
    def dragEnterEvent(self, event):
        if event.mimeData().hasUrls():
            event.acceptProposedAction()
    def dropEvent(self, event):
        paths = [u.toLocalFile() for u in event.mimeData().urls()]
        if not paths: return
        self.pending_inputs = paths
        self._prepare_preview_from_inputs(paths)
        self._start_worker(paths)  # D&Dは即開始

    # ===== ユーティリティ =====
    def _current_color(self) -> str:
        return "white" if self.combo_color.currentIndex()==0 else "black"
    def _current_direction(self) -> str:
        return ["horizontal","vertical","both"][self.combo_dir.currentIndex()]
    def _margin_percent(self) -> int:
        return self.spin_margin.value() if self.chk_margin.isChecked() else 0

    # ===== 設定保存 =====
    def closeEvent(self, e):
        g = self.geometry()
        cfg = self.cfg
        cfg.color_type = self._current_color()
        cfg.direction = self._current_direction()
        cfg.keep_margin_checked = self.chk_margin.isChecked()
        cfg.keep_margin_percent = self.spin_margin.value()
        cfg.maximized = self.isMaximized()
        if not self.isMaximized():
            cfg.win_x, cfg.win_y, cfg.win_w, cfg.win_h = g.x(), g.y(), g.width(), g.height()
        save_settings(cfg)
        super().closeEvent(e)

    # ===== UI操作 =====
    def _show_readme(self):
        d = ReadmeDialog(self); d.move(self.frameGeometry().center() - d.rect().center()); d.show()

    def _pick_files(self):
        exts = " ".join(f"*{e}" for e in SUPPORTED_EXTS)
        paths, _ = QFileDialog.getOpenFileNames(self, "画像を選択", "", f"Images ({exts})")
        if not paths: return
        self.pending_inputs = paths
        self._prepare_preview_from_inputs(paths)

    def _pick_dir(self):
        d = QFileDialog.getExistingDirectory(self, "フォルダ選択", "")
        if not d: return
        self.pending_inputs = [d]
        self._prepare_preview_from_inputs([d])

    def _start_from_pending(self):
        if not self.pending_inputs:
            QMessageBox.information(self, "ファイル未選択", "画像またはフォルダを選択/ドロップ。")
            return
        self._start_worker(self.pending_inputs)

    def _prepare_preview_from_inputs(self, inputs: List[str]):
        # 1枚を探してプレビュー
        first_img = None
        if len(inputs)==1 and os.path.isfile(inputs[0]) and inputs[0].lower().endswith(SUPPORTED_EXTS):
            first_img = inputs[0]
        else:
            # フォルダ or 複数 → 最初に見つかった画像
            for p in inputs:
                if os.path.isdir(p):
                    for root,_,files in os.walk(p):
                        for f in files:
                            if f.lower().endswith(SUPPORTED_EXTS):
                                first_img = os.path.join(root,f); break
                        if first_img: break
                elif os.path.isfile(p) and p.lower().endswith(SUPPORTED_EXTS):
                    first_img = p
                if first_img: break
        if first_img:
            self._last_preview_path = first_img
            self._update_preview_with_box(first_img)

    # ===== プレビューに検出枠を描画 =====
    def _update_preview_if_any(self, *args):
        if self._last_preview_path and os.path.exists(self._last_preview_path):
            self._update_preview_with_box(self._last_preview_path)

    def _update_preview_with_box(self, path: str):
        orig = Image.open(path)
        # 検出はRGB（透明は白or黒で合成）
        det = _rgb_for_detection(orig, self._current_color())
        l,r,t,b = detect_whitespace(det, self._current_color(), self._current_direction(), 70)

        qbytes = det.tobytes()
        qimg = QImage(qbytes, det.width, det.height, det.width*3, QImage.Format.Format_RGB888)
        pm = QPixmap.fromImage(qimg)
        scaled = pm.scaled(self.preview.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation)

        sx = scaled.width()  / pm.width()
        sy = scaled.height() / pm.height()

        # 枠を描く
        tmp = scaled.copy()
        painter = QPainter(tmp)
        pen = QPen(QColor(255, 64, 64), 3, Qt.DashLine)
        painter.setPen(pen)
        painter.drawRect(int(l*sx), int(t*sy), int((r-l)*sx), int((b-t)*sy))
        painter.end()

        # レターボックス背景に配置
        canvas = QPixmap(self.preview.size())
        canvas.fill(QColor(34,34,34))
        ox = (self.preview.width()  - tmp.width() ) // 2
        oy = (self.preview.height() - tmp.height()) // 2
        p2 = QPainter(canvas)
        p2.drawPixmap(ox, oy, tmp)
        p2.end()
        self.preview.setPixmap(canvas)

    # ====== 非同期開始/キャンセル ======
    def _start_worker(self, inputs: List[str]):
        if hasattr(self, "worker") and self.worker and self.worker.isRunning():
            QMessageBox.warning(self, "実行中", "現在の処理が終わるまでお待ちください。")
            return
        self.progress.setValue(0)
        self.worker = WorkerThread(
            inputs,
            color_type=self._current_color(),
            direction=self._current_direction(),
            keep_margin_percent=self._margin_percent()
        )
        self.worker.signals.progress.connect(self._on_progress)
        self.worker.signals.finished.connect(self._on_finished)
        self.worker.signals.error.connect(self._on_error)
        self.btn_cancel.setEnabled(True)
        self.btn_start.setEnabled(False)
        self.worker.start()

    def _cancel_worker(self):
        if self.worker and self.worker.isRunning():
            self.worker.cancel()

    def _on_progress(self, done: int, total: int):
        self.progress.setMaximum(total)
        self.progress.setValue(done)

    def _on_finished(self, errors: list):
        self.btn_cancel.setEnabled(False)
        self.btn_start.setEnabled(True)
        if errors:
            QMessageBox.warning(self, "完了（警告あり）", f"完了したけど {len(errors)} 件エラーがあったよ。\n最初の1件:\n{errors[0]}")
        else:
            QMessageBox.information(self, "完了", "画像の処理が完了しました！")

    def _on_error(self, msg: str):
        self.btn_cancel.setEnabled(False)
        self.btn_start.setEnabled(True)
        QMessageBox.critical(self, "エラー", msg)

    # ===== フレームレス移動/リサイズ =====
    def mousePressEvent(self, e):
        if e.button()==Qt.LeftButton:
            pos = e.position().toPoint()
            edges = self._edge_at(pos)
            if edges:
                self._resizing=True; self._edges=edges
                self._start_geo=self.geometry(); self._start_mouse=e.globalPosition().toPoint()
            else:
                self._moving=True
                self._drag_offset = e.globalPosition().toPoint() - self.frameGeometry().topLeft()
    def mouseMoveEvent(self, e):
        if self._resizing:
            self._resize_to(e.globalPosition().toPoint()); return
        if self._moving and (e.buttons() & Qt.LeftButton) and not self.isMaximized():
            self.move(e.globalPosition().toPoint() - self._drag_offset); return
        edges = self._edge_at(e.position().toPoint())
        if edges in ("TL","BR"): self.setCursor(Qt.SizeFDiagCursor)
        elif edges in ("TR","BL"): self.setCursor(Qt.SizeBDiagCursor)
        elif edges in ("L","R"): self.setCursor(Qt.SizeHorCursor)
        elif edges in ("T","B"): self.setCursor(Qt.SizeVerCursor)
        else: self.setCursor(Qt.ArrowCursor)
    def mouseReleaseEvent(self, e):
        self._resizing=False; self._moving=False
    def changeEvent(self, e):
        super().changeEvent(e)
        if e.type()==QEvent.WindowStateChange:
            self.setStyleSheet(build_qss(self.isMaximized()))
            self.btn_max.setText("❏" if self.isMaximized() else "🗖")
            if hasattr(self,'shadow'): self.shadow.setEnabled(not self.isMaximized())

    # === リサイズ計算 ===
    def _edge_at(self, pos):
        m=RESIZE_MARGIN; r=self.rect(); edges=""
        if pos.y()<=m: edges+="T"
        if pos.y()>=r.height()-m: edges+="B"
        if pos.x()<=m: edges+="L"
        if pos.x()>=r.width()-m: edges+="R"
        return edges
    def _resize_to(self, gpos):
        dx = gpos.x()-self._start_mouse.x()
        dy = gpos.y()-self._start_mouse.y()
        g = self._start_geo; x,y,w,h=g.x(),g.y(),g.width(),g.height()
        minw, minh = self.minimumSize().width(), self.minimumSize().height()
        if "L" in self._edges:
            new_w=max(minw, w-dx); x+=(w-new_w); w=new_w
        if "R" in self._edges:
            w=max(minw, w+dx)
        if "T" in self._edges:
            new_h=max(minh, h-dy); y+=(h-new_h); h=new_h
        if "B" in self._edges:
            h=max(minh, h+dy)
        self.setGeometry(x,y,w,h)
