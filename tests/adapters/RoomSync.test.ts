import { describe, it, expect } from 'vitest';
import { RoomSync } from '../../src/adapters/sync/RoomSync';

// BroadcastChannel is not available in jsdom, so we test the non-channel logic

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

  it('getShareUrl includes the room code', () => {
    const sync = new RoomSync('XYZ-789-QWE');
    expect(sync.getShareUrl()).toContain('#room=XYZ-789-QWE');
  });
});
