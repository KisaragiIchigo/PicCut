// src/main/services/imageSource.ts
import fs from 'node:fs/promises';
import sharp from 'sharp';

/**
 * 画像を一度バッファへ読み込んでから sharp へ渡す。
 *
 * sharp にファイルパスを直接渡すと libvips がそのファイルを開いたまま保持する。
 * 特に JPEG は逐次読みのためハンドルが長く残り、上書き保存で同じファイルを
 * 書き戻す際に Windows が open を拒否して処理が全滅する。
 * 読み込みを先に終わらせてハンドルを手放すことで、この衝突を断つ。
 */
export async function openImage(filePath: string): Promise<sharp.Sharp> {
  return sharp(await fs.readFile(filePath));
}
