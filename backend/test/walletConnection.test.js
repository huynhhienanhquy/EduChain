import assert from 'node:assert/strict';
import test from 'node:test';
import { Wallet } from 'ethers';
import { connectWallet, walletChallenge } from '../src/controllers/auth.controller.js';
import { User } from '../src/models/index.js';

process.env.JWT_SECRET = 'test-only-secret-with-more-than-32-characters';

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

test('wallet connection requires a signature from the linked address', async (t) => {
  const wallet = Wallet.createRandom();
  const otherWallet = Wallet.createRandom();
  const user = { id: 42, walletAddress: null, save: async () => {} };
  const originalFindOne = User.findOne;
  User.findOne = async () => null;
  t.after(() => { User.findOne = originalFindOne; });

  const challengeResponse = response();
  await walletChallenge({ user, body: { walletAddress: wallet.address } }, challengeResponse);
  assert.equal(challengeResponse.statusCode, 200);

  const { message, challengeToken } = challengeResponse.body.data;
  const wrongResponse = response();
  await connectWallet({
    user,
    body: {
      walletAddress: wallet.address,
      challengeToken,
      signature: await otherWallet.signMessage(message),
    },
  }, wrongResponse);
  assert.equal(wrongResponse.statusCode, 400);
  assert.equal(user.walletAddress, null);

  const validResponse = response();
  await connectWallet({
    user,
    body: {
      walletAddress: wallet.address,
      challengeToken,
      signature: await wallet.signMessage(message),
    },
  }, validResponse);
  assert.equal(validResponse.statusCode, 200);
  assert.equal(user.walletAddress, wallet.address);
});
