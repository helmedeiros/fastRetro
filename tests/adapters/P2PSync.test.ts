import { describe, it, expect } from 'vitest';
import { P2PHost } from '../../src/adapters/sync/P2PHost';
import { P2PPeer } from '../../src/adapters/sync/P2PPeer';
import { createRetro } from '../../src/domain/retro/Retro';

// WebRTC APIs aren't available in Node — test protocol logic and safety
describe('P2P Sync Protocol', () => {
  it('P2PHost can be instantiated', () => {
    const host = new P2PHost();
    expect(host.getConnectedPeerCount()).toBe(0);
    expect(host.getVotesForStage('brainstorm')).toBe(0);
  });

  it('P2PPeer can be instantiated', () => {
    const peer = new P2PPeer();
    expect(peer.isConnected()).toBe(false);
  });

  it('P2PHost tracks stage votes', () => {
    const host = new P2PHost();
    expect(host.getVotesForStage('brainstorm')).toBe(0);
    host.resetVotes();
    expect(host.getVotesForStage('brainstorm')).toBe(0);
  });

  it('P2PHost close is safe to call multiple times', () => {
    const host = new P2PHost();
    host.close();
    host.close();
    expect(host.getConnectedPeerCount()).toBe(0);
  });

  it('P2PPeer close is safe to call when not connected', () => {
    const peer = new P2PPeer();
    peer.close();
    expect(peer.isConnected()).toBe(false);
  });

  it('P2PPeer sendVoteStage does nothing when not connected', () => {
    const peer = new P2PPeer();
    // Should not throw
    peer.sendVoteStage('brainstorm', 'p-1');
    expect(peer.isConnected()).toBe(false);
  });

  it('P2PHost broadcast does nothing with no peers', () => {
    const host = new P2PHost();
    const state = createRetro();
    // Should not throw
    host.broadcast(state);
    expect(host.getConnectedPeerCount()).toBe(0);
  });
});
