import { describe, it, expect, vi, afterEach } from 'vitest';
import { RoomSync } from '../../src/adapters/sync/RoomSync';

describe('RoomSync', () => {
  it('generates a room code in XXX-XXX-XXX format when hosting', () => {
    const sync = new RoomSync();
    expect(sync.roomCode).toMatch(/^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    expect(sync.isHost).toBe(true);
  });

  it('uses provided code when joining', () => {
    const sync = new RoomSync('ABC-123-DEF');
    expect(sync.roomCode).toBe('ABC-123-DEF');
    expect(sync.isHost).toBe(false);
  });

  it('generates unique codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      codes.add(new RoomSync().roomCode);
    }
    expect(codes.size).toBeGreaterThan(15);
  });

  it('extractRoomCodeFromHash returns null for empty hash', () => {
    window.location.hash = '';
    expect(RoomSync.extractRoomCodeFromHash()).toBeNull();
  });

  it('extractRoomCodeFromHash extracts code from valid hash', () => {
    window.location.hash = '#room=ABC-123-DEF';
    expect(RoomSync.extractRoomCodeFromHash()).toBe('ABC-123-DEF');
    window.location.hash = '';
  });

  it('extractRoomCodeFromHash returns null for invalid hash', () => {
    window.location.hash = '#other=something';
    expect(RoomSync.extractRoomCodeFromHash()).toBeNull();
    window.location.hash = '';
  });

  it('disconnect is safe to call without connect', () => {
    const sync = new RoomSync();
    sync.disconnect();
    expect(sync.roomCode).toBeTruthy();
  });

  it('getShareUrl includes the room code', async () => {
    const sync = new RoomSync('XYZ-789-QWE');
    expect(await sync.getShareUrl()).toContain('#room=XYZ-789-QWE');
  });

  describe('getShareUrl LAN IP substitution', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('replaces a localhost origin with the LAN IP from the server', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ ip: '10.192.190.148' }),
      }));

      const sync = new RoomSync('XYZ-789-QWE');
      const url = await sync.getShareUrl();

      expect(url).toContain('10.192.190.148');
      expect(url).not.toContain('localhost');
    });

    it('falls back to the original origin when no LAN IP is available', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ ip: null }),
      }));

      const sync = new RoomSync('XYZ-789-QWE');
      const url = await sync.getShareUrl();

      expect(url).toContain(window.location.origin);
    });
  });
});
