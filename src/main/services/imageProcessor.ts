// src/main/services/imageProcessor.ts
// 画像処理まわりの公開窓口。実装は processing/ と batch/ に分かれており、
// ここは main プロセスから参照される入口をまとめるバレルに徹する。

export { detectWithCache } from './detectionCache';
export { scanDirectoryRecursively } from './processing/fileScan';
export { processSingleImageFile } from './processing/processSingleImage';
export { computeBatchPlan } from './batch/computeBatchPlan';
export type { BatchPlanOptions } from './batch/computeBatchPlan';
export { BatchProcessor } from './batch/BatchProcessor';
