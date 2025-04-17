import type { Clock } from '../../domain/ports/Clock';
import type { Downloader } from '../../domain/ports/Downloader';
import type { RetroRepository } from '../../domain/ports/RetroRepository';
import { serializeRetroToExportJson } from '../../domain/retro/Retro';

function pad(n: number): string {
  return n < 10 ? `0${String(n)}` : String(n);
}

export function exportFilename(now: Date): string {
  return `fastretro-${String(now.getUTCFullYear())}-${pad(
    now.getUTCMonth() + 1,
  )}-${pad(now.getUTCDate())}.json`;
}

export class ExportRetro {
  constructor(
    private readonly repo: RetroRepository,
    private readonly clock: Clock,
    private readonly downloader: Downloader,
  ) {}

  execute(): void {
    const state = this.repo.load();
    const nowMs = this.clock.now();
    const nowDate = new Date(nowMs);
    const iso = nowDate.toISOString();
    const payload = serializeRetroToExportJson(state, iso);
    this.downloader.download({
      filename: exportFilename(nowDate),
      mimeType: 'application/json',
      contents: JSON.stringify(payload, null, 2),
    });
  }
}
