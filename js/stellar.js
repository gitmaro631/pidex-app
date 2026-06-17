// Stellar 트랜잭션 빌더 (PiDEX 테스트넷)

import { HORIZON_URL } from './horizon.js';

const NETWORK_PASSPHRASE = 'Pi Testnet'; // PiDEX 테스트넷 패스프레이즈

function getServer() {
  return new StellarSdk.Server(HORIZON_URL);
}

function assetFromString(assetStr) {
  if (assetStr === 'Pi' || assetStr === 'native') return StellarSdk.Asset.native();
  const [code, issuer] = assetStr.split(':');
  return new StellarSdk.Asset(code, issuer);
}

// 단순 스왑 트랜잭션
export async function buildSwapTransaction({ sourceKeypair, sendAsset, sendAmount, destAsset, minReceive }) {
  const server  = getServer();
  const account = await server.loadAccount(sourceKeypair.publicKey());
  const fee     = await server.fetchBaseFee();

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(StellarSdk.Operation.pathPaymentStrictSend({
      sendAsset:    assetFromString(sendAsset),
      sendAmount:   sendAmount.toFixed(7),
      destination:  sourceKeypair.publicKey(),
      destAsset:    assetFromString(destAsset),
      destMin:      minReceive.toFixed(7),
      path:         [],
    }))
    .setTimeout(30)
    .build();

  tx.sign(sourceKeypair);
  return tx.toXDR();
}

// 삼각 차익거래 트랜잭션 (경로 지불 — 하나의 트랜잭션)
export async function buildArbitrageTransaction({ sourceKeypair, sendAmount, path, minReturn }) {
  const server  = getServer();
  const account = await server.loadAccount(sourceKeypair.publicKey());
  const fee     = await server.fetchBaseFee();

  // path: ['Pi', 'BLUE:issuer', 'ORANGE:issuer', 'Pi'] 형태
  const assets   = path.map(assetFromString);
  const sendAsset = assets[0];
  const destAsset = assets[assets.length - 1];
  const midPath   = assets.slice(1, -1);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(StellarSdk.Operation.pathPaymentStrictSend({
      sendAsset,
      sendAmount: sendAmount.toFixed(7),
      destination: sourceKeypair.publicKey(),
      destAsset,
      destMin:    minReturn.toFixed(7),
      path:       midPath,
    }))
    .setTimeout(30)
    .build();

  tx.sign(sourceKeypair);
  return tx.toXDR();
}

// LP 예치 트랜잭션 (스왑 + 예치 분리 실행)
export async function buildLPDepositTransaction({ sourceKeypair, poolId, maxAmountA, maxAmountB, minPrice, maxPrice }) {
  const server  = getServer();
  const account = await server.loadAccount(sourceKeypair.publicKey());
  const fee     = await server.fetchBaseFee();

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(StellarSdk.Operation.liquidityPoolDeposit({
      liquidityPoolId: poolId,
      maxAmountA:      maxAmountA.toFixed(7),
      maxAmountB:      maxAmountB.toFixed(7),
      minPrice:        { n: Math.floor(minPrice * 10000000), d: 10000000 },
      maxPrice:        { n: Math.floor(maxPrice * 10000000), d: 10000000 },
    }))
    .setTimeout(30)
    .build();

  tx.sign(sourceKeypair);
  return tx.toXDR();
}
