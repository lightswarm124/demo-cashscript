// test-self-send.js (ESM)

import {
  Contract,
  ElectrumNetworkProvider,
  TransactionBuilder,
  Network,
  SignatureTemplate,
} from "cashscript";
import { compileFile } from "cashc";
import { URL } from "url";
import { aliceAddress, alicePkh, alicePriv, alicePub } from "./common.js";

// ---- Disable CashScript debug (defensive; avoids "placeholder scenario" errors) ----
process.env.CASHSCRIPT_DEBUG = "0";
process.env.CASHSCRIPT_DEBUG = "0"; // in case of alternate var name

// ------------------------------ Config ---------------------------------------
const NETWORK = Network.CHIPNET;
const SAT_PER_BYTE = 1;
const DUST = 546n;
const TRANSFER_AMOUNT = 3000n; // send 3,000 sats to self

// ------------------------------ Utils ----------------------------------------
function separateUtxos(utxos) {
  const withToken = [];
  const withoutToken = [];
  for (const u of utxos) (u.token == null ? withoutToken : withToken).push(u);
  return { withToken, withoutToken };
}

// simple P2PKH size estimator at 1 sat/byte
function getByteCount(inputs, outputs) {
  // classic 148/34/10 approximation
  const inBytes = 148 * (inputs.P2PKH ?? 0);
  const outBytes = 34 * (outputs.P2PKH ?? 0);
  return Math.ceil(inBytes + outBytes + 10); // bytes (no segwit on BCH)
}

// choose smallest set of UTXOs that cover amount+fee; prefer 2 outputs if change >= dust
function selectUtxosForAmount(allUtxos, amount) {
  const utxos = [...allUtxos].sort((a, b) => Number(a.satoshis - b.satoshis));
  const selected = [];
  let total = 0n;

  for (const u of utxos) {
    selected.push(u);
    total += u.satoshis;

    // try with change (2 outputs)
    let fee = BigInt(getByteCount({ P2PKH: selected.length }, { P2PKH: 2 })) * BigInt(SAT_PER_BYTE);
    let change = total - amount - fee;
    if (change >= 0n) {
      if (change >= DUST) {
        return { inputs: selected, outputs: 2, fee, change };
      } else {
        // collapse to 1 output (let tiny remainder go to fee)
        fee = BigInt(getByteCount({ P2PKH: selected.length }, { P2PKH: 1 })) * BigInt(SAT_PER_BYTE);
        change = total - amount - fee;
        if (change >= 0n && change < DUST) return { inputs: selected, outputs: 1, fee, change: 0n };
        if (change >= DUST) return { inputs: selected, outputs: 2, fee, change }; // rare edge
      }
    }
  }
  throw new Error("Not enough BCH in UTXOs to cover amount + fee.");
}

// wrap provider to log getUtxos calls clearly
function withLogging(provider) {
  const getUtxosOrig = provider.getUtxos.bind(provider);
  provider.getUtxos = async (addr) => {
    console.log(`[provider.getUtxos] → ${addr}`);
    const utxos = await getUtxosOrig(addr);
    console.log(`[provider.getUtxos] ← ${utxos.length} UTXOs`);
    return utxos;
  };
  return provider;
}

// ---------------------- Flow 1: Regular UTXO self-send -----------------------
async function sendRegularSelf(provider, freshUtxos) {
  console.log("\n=== Regular UTXO self-send ===");

  // use the fresh UTXOs we already fetched
  const { withoutToken } = separateUtxos(freshUtxos);

  if (!withoutToken.length) {
    console.warn("No spendable (non-token) UTXOs for aliceAddress. Nothing to send.");
    return null;
  }

  // plan inputs/outputs for 3,000-sat self-send
  const plan = selectUtxosForAmount(withoutToken, TRANSFER_AMOUNT);

  const aliceTemplate = new SignatureTemplate(alicePriv);
  const inputs = plan.inputs.map((u) => ({ ...u, unlocker: aliceTemplate.unlockP2PKH() }));

  const txb = new TransactionBuilder({ provider });
  txb.addInputs(inputs);

  // payment to self
  txb.addOutput({ to: aliceAddress, amount: TRANSFER_AMOUNT });

  // change to self if not dust
  if (plan.outputs === 2 && plan.change >= DUST) {
    txb.addOutput({ to: aliceAddress, amount: plan.change });
  }

  // ---- Build and broadcast manually (avoid .send() to skip debug hook) ----
  const raw = await txb.build(); // hex string
  console.log("Built raw tx bytes:", raw.length / 2);

  const txid = await provider.sendRawTransaction(raw);
  console.log("TXID:", txid);
  console.log("Inputs:", inputs.length, "Outputs:", plan.outputs);
  console.log("Sent  :", TRANSFER_AMOUNT.toString(), "sats →", aliceAddress);
  if (plan.change >= DUST) console.log("Change:", plan.change.toString(), "sats →", aliceAddress);
  else console.log("No change output (tiny remainder used as fee).");

  return txid;
}

// ---------------------- Flow 2: Contract spend (optional) --------------------
async function spendFromContractToAlice(provider) {
  console.log("\n=== Contract spend (optional) ===");

  const artifact = compileFile(new URL("p2pkh.cash", import.meta.url));
  const contract = new Contract(artifact, [alicePkh], {
    provider,
    addressType: "p2sh32",
  });

  const utxos = await contract.getUtxos();
  const { withoutToken } = separateUtxos(utxos);
  if (!withoutToken.length) {
    console.warn("No spendable contract UTXOs. Skipping contract test.");
    return null;
  }

  // Use high-level API for a quick contract spend. If this ever triggers debug errors,
  // switch to: const raw = await contract.functions....to(...).build(); await provider.sendRawTransaction(raw);
  const sent = await contract.functions
    .spend(alicePub, new SignatureTemplate(alicePriv)) // adjust to your .cash function
    .to(aliceAddress, TRANSFER_AMOUNT)
    .send();

  console.log("Contract TXID:", sent.txid);
  return sent.txid;
}

// --------------------------------- Runner ------------------------------------
async function run() {
  const provider = withLogging(new ElectrumNetworkProvider(NETWORK));

  console.log("\nFetching latest UTXOs for aliceAddress BEFORE building the tx…");
  const freshUtxos = await provider.getUtxos(aliceAddress);

  if (freshUtxos.length === 0) {
    console.warn("aliceAddress currently has NO UTXOs. Aborting self-send test.");
    return;
  }

  await sendRegularSelf(provider, freshUtxos);

  // OPTIONAL: toggle on if/when you want to test contract path
  // await spendFromContractToAlice(provider);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
