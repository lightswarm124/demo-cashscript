import { hash160 } from '@cashscript/utils';
import {
  deriveHdPrivateNodeFromSeed,
  deriveHdPath,
  secp256k1,
  encodeCashAddress,
} from '@bitauth/libauth';
import bip39 from 'bip39';

// This is duplicated from common.ts because it is not possible to import from a .ts file in p2pkh.js

// Generate entropy from BIP39 mnemonic phrase and initialise a root HD-wallet node
const seed = await bip39.mnemonicToSeed('talk story visual hidden behind wasp evil abandon bus brand circle sketch');
const rootNode = deriveHdPrivateNodeFromSeed(seed, true);
const baseDerivationPath = "m/44'/1'/0'/0";

// Derive Alice's private key, public key, public key hash and address
const aliceNode = deriveHdPath(rootNode, `${baseDerivationPath}/0`);
if (typeof aliceNode === 'string') throw new Error();
export const alicePub = secp256k1.derivePublicKeyCompressed(aliceNode.privateKey);
export const alicePriv = aliceNode.privateKey;
export const alicePkh = hash160(alicePub);
export const aliceAddress = encodeCashAddress('bchtest', 'p2pkh', alicePkh);
export const aliceTokenAddress = encodeCashAddress('bchtest', 'p2pkhWithTokens', alicePkh);

// Derive Bob's private key, public key, public key hash and address
const bobNode = deriveHdPath(rootNode, `${baseDerivationPath}/1`);
if (typeof bobNode === 'string') throw new Error();
export const bobPub = secp256k1.derivePublicKeyCompressed(bobNode.privateKey);
export const bobPriv = bobNode.privateKey;
export const bobPkh = hash160(bobPub);
export const bobAddress = encodeCashAddress('bchtest', 'p2pkh', bobPkh);
export const bobTokenAddress = encodeCashAddress('bchtest', 'p2pkhWithTokens', bobPkh);

// export const aliceAddress = encodeCashAddress({
//   payload: alicePkh, 
//   prefix: 'bchtest',
//   type: 'p2pkh' 
// }).address;