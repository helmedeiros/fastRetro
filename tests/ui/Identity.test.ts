import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIdentity } from '../../src/ui/hooks/useIdentity';

describe('useIdentity hook', () => {
  it('starts with null participantId', () => {
    const { result } = renderHook(() => useIdentity());
    expect(result.current.participantId).toBeNull();
  });

  it('setParticipantId updates the id', () => {
    const { result } = renderHook(() => useIdentity());
    act(() => { result.current.setParticipantId('p-1'); });
    expect(result.current.participantId).toBe('p-1');
  });

  it('clear resets to null', () => {
    const { result } = renderHook(() => useIdentity());
    act(() => { result.current.setParticipantId('p-1'); });
    expect(result.current.participantId).toBe('p-1');
    act(() => { result.current.clear(); });
    expect(result.current.participantId).toBeNull();
  });

  it('exposes stable callback references', () => {
    const { result, rerender } = renderHook(() => useIdentity());
    const first = {
      setParticipantId: result.current.setParticipantId,
      clear: result.current.clear,
    };
    rerender();
    expect(result.current.setParticipantId).toBe(first.setParticipantId);
    expect(result.current.clear).toBe(first.clear);
  });
});
