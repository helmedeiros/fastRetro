import { describe, it, expect } from 'vitest';
import { InMemoryRetroRepository } from '../../src/adapters/storage/InMemoryRetroRepository';
import { StartClose } from '../../src/application/usecases/StartClose';
import {
  ExportRetro,
  exportFilename,
} from '../../src/application/usecases/ExportRetro';
import {
  addCardToBrainstorm,
  addDiscussNote,
  addParticipant,
  advanceDiscussSegment,
  castVote,
  createRetro,
  startBrainstorm,
  startDiscuss,
  startGroup,
  startIcebreaker,
  startReview,
  startVote,
} from '../../src/domain/retro/Retro';
import type { Clock, ClockUnsubscribe } from '../../src/domain/ports/Clock';
import type {
  DownloadFile,
  Downloader,
} from '../../src/domain/ports/Downloader';
import type { IdGenerator } from '../../src/domain/ports/IdGenerator';
import type { Picker } from '../../src/domain/ports/Picker';

const firstPicker: Picker<string> = {
  pick: <T,>(items: readonly T[]): T => items[0] as T,
};

class SeqIds implements IdGenerator {
  private n = 0;
  next(): string {
    this.n += 1;
    return `c-${String(this.n)}`;
  }
}

class FixedClock implements Clock {
  constructor(private readonly fixed: number) {}
  now(): number {
    return this.fixed;
  }
  subscribe(): ClockUnsubscribe {
    return () => {};
  }
}

class RecordingDownloader implements Downloader {
  public calls: DownloadFile[] = [];
  download(file: DownloadFile): void {
    this.calls.push(file);
  }
}

function buildReviewState() {
  let s = createRetro();
  s = addParticipant(s, 'p-1', 'Alice');
  s = startIcebreaker(s, firstPicker);
  s = startBrainstorm(s);
  const ids = new SeqIds();
  s = addCardToBrainstorm(s, 'start', 'ship faster', ids);
  s = startGroup(s);
  s = startVote(s);
  s = castVote(s, 'p-1', 'c-1');
  s = startDiscuss(s);
  s = advanceDiscussSegment(s);
  s = addDiscussNote(s, 'c-1', 'actions', 'fix flaky test', ids);
  s = startReview(s);
  return s;
}

describe('StartClose use case', () => {
  it('transitions review -> close', () => {
    const repo = new InMemoryRetroRepository(buildReviewState());
    new StartClose(repo).execute();
    expect(repo.load().stage).toBe('close');
  });
});

describe('ExportRetro use case', () => {
  it('downloads JSON with correct filename pattern', () => {
    let s = buildReviewState();
    // transition to close directly through repo
    const repo = new InMemoryRetroRepository(s);
    new StartClose(repo).execute();
    s = repo.load();
    const fixedMs = Date.UTC(2025, 3, 17, 15, 0, 0); // April 17 2025 UTC
    const clock = new FixedClock(fixedMs);
    const downloader = new RecordingDownloader();
    new ExportRetro(repo, clock, downloader).execute();
    expect(downloader.calls).toHaveLength(1);
    const file = downloader.calls[0];
    expect(file.filename).toMatch(/^fastretro-\d{4}-\d{2}-\d{2}\.json$/);
    expect(file.filename).toBe('fastretro-2025-04-17.json');
    expect(file.mimeType).toBe('application/json');
    const parsed = JSON.parse(file.contents) as {
      version: number;
      participants: { id: string; name: string }[];
      createdAt: string;
    };
    expect(parsed.version).toBe(1);
    expect(parsed.participants).toEqual([{ id: 'p-1', name: 'Alice' }]);
    expect(parsed.createdAt).toBe(new Date(fixedMs).toISOString());
  });
});

describe('exportFilename', () => {
  it('pads month and day', () => {
    expect(exportFilename(new Date(Date.UTC(2025, 0, 3)))).toBe(
      'fastretro-2025-01-03.json',
    );
  });
});
