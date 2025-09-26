import os, sys, json
from dataclasses import dataclass, asdict
from pathlib import Path

APP_NAME = "PicCut"
CFG_FILENAME = "[config]PicCut_config.json"


def _base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def settings_path() -> Path:
    base = _base_dir()
    cfg_dir = base / "config"
    cfg_dir.mkdir(parents=True, exist_ok=True)
    return cfg_dir / CFG_FILENAME


@dataclass
class AppSettings:
    color_type: str = "white"           # "white" | "black"
    direction: str = "horizontal"       # "horizontal" | "vertical" | "both"
    keep_margin_checked: bool = True
    keep_margin_percent: int = 5
    win_x: int = -1
    win_y: int = -1
    win_w: int = 1000
    win_h: int = 660
    maximized: bool = False


def load_settings() -> AppSettings:
    try:
        p = settings_path()
        if p.exists():
            with p.open("r", encoding="utf-8") as f:
                data = json.load(f)
            default = asdict(AppSettings())
            default.update(data)
            return AppSettings(**default)
    except Exception:
        pass
    return AppSettings()


def save_settings(cfg: AppSettings) -> None:
    try:
        p = settings_path()
        with p.open("w", encoding="utf-8") as f:
            json.dump(asdict(cfg), f, ensure_ascii=False, indent=2)
    except Exception:
        pass
