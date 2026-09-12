// src/main/services/processing/outputPath.ts
import path from 'node:path';
import { ProcessImageOptions } from '../../../shared/types';

export function computeOutputPath(filePath: string, options: ProcessImageOptions): string {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);

  let targetDir = dir;
  if (options.saveMode === 'remake_folder') {
    targetDir = path.join(dir, 'Remake');
  } else if (options.saveMode === 'custom_dir' && options.customOutputDir) {
    targetDir = options.customOutputDir;
  }

  let finalName = baseName;
  if (options.addSuffix && options.suffixString) {
    finalName = `${baseName}${options.suffixString}`;
  }

  let targetExt = ext;
  if (options.outputFormat === 'png') targetExt = '.png';
  else if (options.outputFormat === 'webp') targetExt = '.webp';
  else if (options.outputFormat === 'jpeg') targetExt = '.jpg';

  return path.join(targetDir, `${finalName}${targetExt}`);
}
