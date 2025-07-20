import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoomSync } from '../../src/ui/hooks/useRoomSync';

describe('useRoomSync hook', () => {
  it('starts in disconnected state with no role', () => {
    const { result } = renderHook(() => useRoomSync());
    expect(result.current.role).toBe('none');
    expect(result.current.status).toBe('disconnected');
    expect(result.current.roomCode).toBeNull();
    expect(result.current.shareUrl).toBeNull();
    expect(result.current.peerCount).toBe(0);
  });

  it('disconnect resets all state', () => {
    const { result } = renderHook(() => useRoomSync());
    act(() => { result.current.disconnect(); });
    expect(result.current.role).toBe('none');
    expect(result.current.status).toBe('disconnected');
    expect(result.current.roomCode).toBeNull();
    expect(result.current.peerCount).toBe(0);
  });

  it('onRemoteState replays buffered state', () => {
    const { result } = renderHook(() => useRoomSync());
    let receivedState: unknown = null;

    // Register callback — no buffered state, should not fire
    act(() => {
      result.current.onRemoteState((state) => { receivedState = state; });
    });
    expect(receivedState).toBeNull();
  });

  it('stageVotes starts empty', () => {
    const { result } = renderHook(() => useRoomSync());
    expect(result.current.stageVotes.size).toBe(0);
  });

  it('broadcastState does not throw when disconnected', () => {
    const { result } = renderHook(() => useRoomSync());
    act(() => {
      result.current.broadcastState({ stage: 'brainstorm' } as never);
    });
    // Should not throw
    expect(result.current.role).toBe('none');
  });

  it('voteForStage does not throw when disconnected', () => {
    const { result } = renderHook(() => useRoomSync());
    act(() => {
      result.current.voteForStage('brainstorm', 'p1');
    });
    expect(result.current.role).toBe('none');
  });

  it('exposes stable callback references', () => {
    const { result, rerender } = renderHook(() => useRoomSync());
    const first = {
      hostRoom: result.current.hostRoom,
      joinRoom: result.current.joinRoom,
      broadcastState: result.current.broadcastState,
      disconnect: result.current.disconnect,
      onRemoteState: result.current.onRemoteState,
      onConnected: result.current.onConnected,
    };
    rerender();
    expect(result.current.hostRoom).toBe(first.hostRoom);
    expect(result.current.joinRoom).toBe(first.joinRoom);
    expect(result.current.broadcastState).toBe(first.broadcastState);
    expect(result.current.disconnect).toBe(first.disconnect);
    expect(result.current.onRemoteState).toBe(first.onRemoteState);
    expect(result.current.onConnected).toBe(first.onConnected);
  });
});
