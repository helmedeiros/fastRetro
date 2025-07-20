import { describe, it, expect } from 'vitest';
import { RoomSync } from '../../src/adapters/sync/RoomSync';

describe('WebSocket Sync - Regression cases', () => {
  describe('RoomSync room code', () => {
    it('host generates unique room codes', () => {
      const codes = new Set(Array.from({ length: 50 }, () => new RoomSync().roomCode));
      expect(codes.size).toBeGreaterThan(40);
    });

    it('guest uses provided room code exactly', () => {
      const sync = new RoomSync('ABC-123-DEF');
      expect(sync.roomCode).toBe('ABC-123-DEF');
      expect(sync.isHost).toBe(false);
    });

    it('host is identified correctly', () => {
      const host = new RoomSync();
      expect(host.isHost).toBe(true);
      const guest = new RoomSync('XXX-YYY-ZZZ');
      expect(guest.isHost).toBe(false);
    });
  });

  describe('URL hash extraction', () => {
    it('extracts room code from valid hash', () => {
      window.location.hash = '#room=ABC-123-DEF';
      expect(RoomSync.extractRoomCodeFromHash()).toBe('ABC-123-DEF');
      window.location.hash = '';
    });

    it('returns null for empty hash', () => {
      window.location.hash = '';
      expect(RoomSync.extractRoomCodeFromHash()).toBeNull();
    });

    it('returns null for non-room hash', () => {
      window.location.hash = '#other=value';
      expect(RoomSync.extractRoomCodeFromHash()).toBeNull();
      window.location.hash = '';
    });

    it('handles case-insensitive room codes', () => {
      window.location.hash = '#room=abc-123-def';
      expect(RoomSync.extractRoomCodeFromHash()).toBe('abc-123-def');
      window.location.hash = '';
    });
  });

  describe('Share URL', () => {
    it('includes room code in share URL', () => {
      const sync = new RoomSync('MY-ROOM-123');
      const url = sync.getShareUrl();
      expect(url).toContain('#room=MY-ROOM-123');
      expect(url).toContain(window.location.origin);
    });
  });

  describe('Callback registration', () => {
    it('onState callback can be set before connect', () => {
      const sync = new RoomSync('TEST-CB-001');
      let called = false;
      sync.onState(() => { called = true; });
      // Should not throw
      expect(called).toBe(false);
    });

    it('onConnected callback can be set', () => {
      const sync = new RoomSync('TEST-CB-002');
      let called = false;
      sync.onConnected(() => { called = true; });
      expect(called).toBe(false);
    });

    it('multiple callbacks can be registered', () => {
      const sync = new RoomSync('TEST-CB-003');
      sync.onState(() => undefined);
      sync.onVoteStage(() => undefined);
      sync.onNavigateStage(() => undefined);
      sync.onPeerCount(() => undefined);
      sync.onRequestState(() => undefined);
      sync.onConnected(() => undefined);
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Disconnect safety', () => {
    it('disconnect before connect is safe', () => {
      const sync = new RoomSync('SAFE-001');
      sync.disconnect();
      expect(sync.roomCode).toBe('SAFE-001');
    });

    it('double disconnect is safe', () => {
      const sync = new RoomSync('SAFE-002');
      sync.disconnect();
      sync.disconnect();
      expect(sync.roomCode).toBe('SAFE-002');
    });

    it('broadcastState before connect is safe', () => {
      const sync = new RoomSync('SAFE-003');
      // Should not throw
      sync.broadcastState({ stage: 'brainstorm' } as never);
      expect(true).toBe(true);
    });

    it('sendVoteStage before connect is safe', () => {
      const sync = new RoomSync('SAFE-004');
      sync.sendVoteStage('brainstorm', 'p1');
      expect(true).toBe(true);
    });
  });

  describe('State isolation by room', () => {
    it('different room codes create different instances', () => {
      const room1 = new RoomSync('ROOM-AAA-111');
      const room2 = new RoomSync('ROOM-BBB-222');
      expect(room1.roomCode).not.toBe(room2.roomCode);
    });

    it('host and guest for same room share the code', () => {
      const host = new RoomSync();
      const guest = new RoomSync(host.roomCode);
      expect(guest.roomCode).toBe(host.roomCode);
      expect(host.isHost).toBe(true);
      expect(guest.isHost).toBe(false);
    });
  });
});
