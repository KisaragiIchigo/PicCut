import sys
from PySide6.QtWidgets import QApplication
from PySide6.QtGui import QFont
from gui import MainWindow
from ui_common import UI_FONT_FAMILY

if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setFont(QFont(UI_FONT_FAMILY, 10))   # 全体フォント: メイリオ
    w = MainWindow()
    w.show()
    sys.exit(app.exec())
