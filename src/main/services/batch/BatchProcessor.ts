// src/main/services/batch/BatchProcessor.ts
import path from 'node:path';
import { BatchPlan, BatchProcessProgress, ProcessImageOptions } from '../../../shared/types';
import { processSingleImageFile } from '../processing/processSingleImage';
import { computeBatchPlan } from './computeBatchPlan';

export class BatchProcessor {
  private isCancelled = false;

  public cancel(): void {
    this.isCancelled = true;
  }

  public async run(
    filePaths: string[],
    options: ProcessImageOptions,
    onProgress: (progress: BatchProcessProgress) => void
  ): Promise<void> {
    this.isCancelled = false;
    const totalCount = filePaths.length;
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ filePath: string; error: string }> = [];

    const emit = (
      phase: 'scanning' | 'processing',
      currentIndex: number,
      currentFileName: string,
      isCompleted: boolean
    ) => {
      onProgress({
        phase,
        currentIndex,
        totalCount,
        currentFileName,
        successCount,
        errorCount,
        isCompleted,
        isCancelled: this.isCancelled,
        errors,
      });
    };

    // 統一基準は全画像の検出結果が揃って初めて決まるため、書き出し前に一度全件を走査する。
    // プレビュー時に算出済みならキャッシュが効くため、ここは素通しに近い速度で終わる。
    let plan: BatchPlan | null = null;
    if (options.unifyBatchSize && filePaths.length > 1) {
      emit('scanning', 0, '', false);
      plan = await computeBatchPlan(
        filePaths,
        {
          colorMode: options.colorMode,
          customColorHex: options.customColorHex,
          threshold: options.threshold,
          noiseTolerance: options.noiseTolerance,
          direction: options.direction,
          unifyCropPosition: options.unifyCropPosition,
        },
        (done, fileName) => emit('scanning', done, fileName, false),
        () => this.isCancelled
      );
    }

    emit('processing', 0, '', false);

    for (let i = 0; i < filePaths.length; i++) {
      if (this.isCancelled) {
        break;
      }

      const filePath = filePaths[i];
      const fileName = path.basename(filePath);

      try {
        await processSingleImageFile({ ...options, filePath }, plan);
        successCount++;
      } catch (err: unknown) {
        errorCount++;
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push({ filePath, error: errMsg });
      }

      emit('processing', i + 1, fileName, i + 1 === totalCount && !this.isCancelled);
    }
  }
}
