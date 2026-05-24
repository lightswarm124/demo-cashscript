import { hash160 } from "@cashscript/utils";
import {
  deriveHdPrivateNodeFromSeed,
  deriveHdPath,
  secp256k1,
  encodeCashAddress,
  encodePrivateKeyWif,
  encodeBech32,
  deriveSeedFromBip39Mnemonic,
} from "@bitauth/libauth";

// This is duplicated from common.ts because it is not possible to import from a .ts file in p2pkh.js

// Generate entropy from BIP39 mnemonic phrase and initialise a root HD-wallet node
export const seed = deriveSeedFromBip39Mnemonic(
  "talk story visual hidden behind wasp evil abandon bus brand circle sketch"
);
// export const seed = deriveSeedFromBip39Mnemonic("");
export const rootNode = deriveHdPrivateNodeFromSeed(seed, {
  assumeValidity: true,
  throwErrors: true,
});
const baseDerivationPath = "m/44'/1'/0'/0";

// Derive Alice's private key, public key, public key hash and address
export const aliceNode = deriveHdPath(rootNode, `${baseDerivationPath}/0`);
if (typeof aliceNode === "string") throw new Error();
export const alicePub = secp256k1.derivePublicKeyCompressed(
  aliceNode.privateKey
);
export const aliceBech32 = encodeBech32(alicePub);
export const alicePriv = aliceNode.privateKey;
export const aliceWIF = encodePrivateKeyWif(alicePriv, "testnet");
export const alicePkh = hash160(alicePub);
export const aliceAddress = encodeCashAddress({
  prefix: "bchtest",
  type: "p2pkh",
  payload: alicePkh,
  throwErrors: true,
}).address;
export const aliceTokenAddress = encodeCashAddress({
  prefix: "bchtest",
  type: "p2pkhWithTokens",
  payload: alicePkh,
  throwErrors: true,
}).address;

// Derive Bob's private key, public key, public key hash and address
const bobNode = deriveHdPath(rootNode, `${baseDerivationPath}/1`);
if (typeof bobNode === "string") throw new Error();
export const bobPub = secp256k1.derivePublicKeyCompressed(bobNode.privateKey);
export const bobPriv = bobNode.privateKey;
export const bobWIF = encodePrivateKeyWif(bobPriv, "testnet");
export const bobPkh = hash160(bobPub);
export const bobAddress = encodeCashAddress({
  prefix: "bchtest",
  type: "p2pkh",
  payload: bobPkh,
  throwErrors: true,
}).address;
export const bobTokenAddress = encodeCashAddress({
  prefix: "bchtest",
  type: "p2pkhWithTokens",
  payload: bobPkh,
  throwErrors: true,
}).address;

// Derive Carol's private key, public key, public key hash and address
const carolNode = deriveHdPath(rootNode, `${baseDerivationPath}/2`);
if (typeof carolNode === "string") throw new Error();
export const carolPub = secp256k1.derivePublicKeyCompressed(
  carolNode.privateKey
);
export const carolPriv = carolNode.privateKey;
export const carolWIF = encodePrivateKeyWif(carolPriv, "testnet");
export const carolPkh = hash160(carolPub);
export const carolAddress = encodeCashAddress({
  prefix: "bchtest",
  type: "p2pkh",
  payload: carolPkh,
  throwErrors: true,
}).address;
export const carolTokenAddress = encodeCashAddress({
  prefix: "bchtest",
  type: "p2pkhWithTokens",
  payload: carolPkh,
  throwErrors: true,
}).address;

// export const aliceAddress = encodeCashAddress({
//   payload: alicePkh,
//   prefix: 'bchtest',
//   type: 'p2pkh'
// }).address;
