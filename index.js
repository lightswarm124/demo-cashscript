import {
  Contract,
  ElectrumNetworkProvider,
  TransactionBuilder,
  Network,
  SignatureTemplate,
} from "cashscript";
import { compileFile } from "cashc";
import * as bitcoin from "bitcoinjs-lib";
import {
  aliceAddress,
  aliceTokenAddress,
  alicePkh,
  alicePriv,
  aliceNode,
  aliceWIF,
  bobAddress,
  bobTokenAddress,
  bobPriv,
  bobPkh,
  alicePub,
  rootNode,
  seed,
  bobPub,
  bobWIF,
  carolAddress,
  carolTokenAddress,
  carolPkh,
  carolPriv,
  carolPub,
  carolWIF,
  aliceBech32,
} from "./common.js";
import { URL } from "url";
import { encodeOutput, getInputSize } from "cashscript/dist/utils.js";

import slpMdm from "slp-mdm";

const btc = bitcoin.payments.p2wpkh({
  pubkey: alicePub,
  network: bitcoin.networks.bitcoin,
});

const hexString = (pkh) => {
  return Array.from(pkh, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

async function run() {
  // console.log("BTC: ", btc.address);
  // console.log("Seed: ", seed);
  // console.log("Root Node: ", rootNode);
  // console.log("Alice Node: ", aliceNode);
  // console.log("Address: ", aliceAddress);
  // console.log(hexString(alicePkh));
  // console.log(hexString(alicePub));
  // console.log(aliceWIF);
  // console.log(hexString(alicePriv));
  // console.log("Address: ", bobAddress);
  // console.log(hexString(bobPkh));
  // console.log(hexString(bobPub));
  // console.log(bobWIF);
  // console.log(hexString(bobPriv));
  // console.log("Address: ", carolAddress);
  // console.log(hexString(carolPkh));
  // console.log(hexString(carolPub));
  // console.log(carolWIF);
  // console.log("Public Key: ", alicePub);
  // console.log("Public Key Hash: ", bobPkh);
  // console.log("Private Key WIF: ", aliceWIF);
  // console.log("Private Key: ", alicePriv);
  // const artifact = compileFile(new URL("p2pkh.cash", import.meta.url));
  const artifact = compileFile(new URL("announcement.cash", import.meta.url));
  const demoArtifact = compileFile(new URL("p2pkh.cash", import.meta.url));

  const provider = new ElectrumNetworkProvider(Network.CHIPNET);

  // const contract = new Contract(artifact, [alicePkh], {
  // const contract = new Contract(artifact, [], {
  //   provider: provider,
  //   addressType: "p2sh32",
  // });

  const demoContract = new Contract(demoArtifact, [alicePkh], {
    provider: provider,
    addressType: "p2sh32",
  });

  const txByteCount = getByteCount({ P2PKH: 1 }, { P2PKH: 2 });

  // console.log(txByteCount);

  const txFee = Math.floor(satoshisPerByte * txByteCount);
  // console.log(txFee);

  const repeatTransaction = 1;

  for (let i = 0; i < repeatTransaction; i++) {
    try {
      // let totalFees = 0;

      // const chunks = sendBuffer;
      // console.log(chunks)

      // const contractUtxos = await contract.getUtxos();
      // // console.log(contractUtxos)
      // const contractBalance = await contract.getBalance();
      // // console.log(contractBalance)

      // const { withToken: tokenUTXO, withoutToken: regularUTXO } = separateUtxos(contractUtxos);
      // console.log(regularUTXO)
      // const { collectedObjects: contractSpendUTXOs, totalSatoshis: satoshiAmount } = collectUTXOs(regularUTXO, 50000)
      // console.log(satoshiAmount)
      // const { collectedObjects: contractTokenUTXOs, totalSatoshis: tokenSatoshi } = collectUTXOs(tokenUTXO, 500)
      // console.log(contractSpendUTXOs)
      // console.log(contractTokenUTXOs)

      // const unlockableContractUtxos = contractSpendUTXOs.map(item => ({
      //   ...item,
      //   unlocker: contract.unlock
      //     .spend(alicePub, new SignatureTemplate(alicePriv))
      //   // .spend(
      //   //   satoshiAmount - BigInt(1000)
      //   // ),
      //   // unlocker: demoContract.unlock.reclaim(
      //   //   alicePub, new SignatureTemplate(alicePriv)
      //   // )
      // }));

      // console.log(unlockableContractUtxos)

      // const unlockableContractTokenUtxos = contractTokenUTXOs.map(item => ({
      //   ...item,
      //   unlocker: contract.unlock.reclaim(
      //     // contractBalance - 155n
      //     alicePub, new SignatureTemplate(alicePriv)
      //   )
      // }));

      // const contractTxOutputs = [
      //   {
      //     to: contract.address,
      //     amount: satoshiAmount - BigInt(500),
      //     // token: {amount: tokenUTXO[0].amount, category: tokenUTXO[0].token.category}
      //   },
      //   // {
      //   //   to: demoContract.tokenAddress,
      //   //   amount: tokenUTXO[0].satoshis,
      //   //   token: {amount: tokenUTXO[0].amount, category: tokenUTXO[0].token.category}
      //   // },
      //   // { to: demoContract.address, amount: satoshiAmount - 524n },
      //   // { to: aliceAddress, amount: sendAmount }
      // ];

      const transactionBuilder = new TransactionBuilder({ provider });

      // transactionBuilder
      //   .addInputs(unlockableContractUtxos)
      //   .addInputs(unlockableContractTokenUtxos)
      //   .addOutputs(contractTxOutputs)

      // console.log(transactionBuilder);
      // // Post "Hello World!" to memo.cash
      // transactionBuilder.addOpReturnOutput(chunks);
      // transactionBuilder.addOpReturnOutput(['0x6d02', `Test Tx Chain: ${i+1}`]);
      // console.log(transactionBuilder.outputs[0]);
      // const opReturnSize = transactionBuilder.outputs[0] ? (transactionBuilder.outputs[0].to).byteLength : 0;
      // console.log(opReturnSize);
      // console.log(transactionBuilder)

      // totalFees += opReturnSize;

      // -------------------------------------------------

      // Fetch UTXOs
      const aliceUtxos = await provider.getUtxos(aliceAddress);
      console.log(aliceUtxos);

      // Separate UTXOs into those with and without tokens
      const { withToken, withoutToken } = separateUtxos(aliceUtxos);

      // console.log(withToken);

      // Collect UTXOs to meet the required amount
      const { collectedObjects, totalSatoshis } = collectUTXOs(
        withoutToken,
        BigInt(30000),
        BigInt(500001)
      );

      // console.log(collectedObjects);

      // console.log(totalSatoshis)

      // Calculate the send amount
      const sendAmount = BigInt(
        Math.floor(
          Number(totalSatoshis) - txFee - 50000 - 50
          // - 680
          // + 31
          // - opReturnSize
          //  / 2
        )
      );
      // console.log(sendAmount)

      // Prepare transaction outputs
      const txOutputs = [
        {
          to: demoContract.address,
          amount: 50000n,
          // token: { amount: 1n, category: withToken[0].token.category },
        },
        { to: aliceAddress, amount: sendAmount },
        // { to: aliceAddress, amount: sendAmount }
      ];

      // Create a signature template for unlocking UTXOs
      const aliceTemplate = new SignatureTemplate(alicePriv);
      // console.log("Alice Template:", aliceTemplate);

      // Prepare UTXOs with unlocker
      const unlockableUtxos = collectedObjects.map((item) => ({
        ...item,
        unlocker: aliceTemplate.unlockP2PKH(),
      }));

      // console.log(unlockableUtxos);

      // Build the transaction
      // transactionBuilder.addInputs(unlockableUtxos);

      // transactionBuilder.addOutputs(txOutputs);
      // .addOutputs(contractTxOutputs)

      // console.log(transactionBuilder);
      // console.log(transactionBuilder.build());
      // console.log(transactionBuilder.build().length / 2);

      // console.log("total fees:", totalFees)

      // // Send the transaction
      // const sendTx = await transactionBuilder.send();

      // // Log the transaction details
      // console.log(`Transaction ${i + 1} detail: `, sendTx.txid);
    } catch (error) {
      console.error(`Error in transaction ${i + 1}:`, error);
      break; // Optionally break the loop if an error occurs
    }
  }
}

const satoshisPerByte = 1;

// const dust = BigInt(546);

// const token_id = "cea2a4e73195369cb7926441d0c9de7ee3b41cb522df1ec66f06b80dd3c61d24"

const getByteCount = (inputs, outputs) => {
  // from https://github.com/bitcoinjs/bitcoinjs-lib/issues/921#issuecomment-354394004
  let totalWeight = 0;
  let hasWitness = false;
  // assumes compressed pubkeys in all cases.
  const types = {
    inputs: {
      "MULTISIG-P2SH": 49 * 4,
      "MULTISIG-P2WSH": 6 + 41 * 4,
      "MULTISIG-P2SH-P2WSH": 6 + 76 * 4,
      P2PKH: 148 * 4,
      P2WPKH: 108 + 41 * 4,
      "P2SH-P2WPKH": 108 + 64 * 4,
    },
    outputs: {
      P2SH: 32 * 4,
      P2PKH: 34 * 4,
      P2WPKH: 31 * 4,
      P2WSH: 43 * 4,
    },
  };

  Object.keys(inputs).forEach(function (key) {
    if (key.slice(0, 8) === "MULTISIG") {
      // ex. "MULTISIG-P2SH:2-3" would mean 2 of 3 P2SH MULTISIG
      const keyParts = key.split(":");
      if (keyParts.length !== 2) throw new Error(`invalid input: ${key}`);
      const newKey = keyParts[0];
      const mAndN = keyParts[1].split("-").map(function (item) {
        return parseInt(item);
      });

      totalWeight += types.inputs[newKey] * inputs[key];
      const multiplyer = newKey === "MULTISIG-P2SH" ? 4 : 1;
      totalWeight += (73 * mAndN[0] + 34 * mAndN[1]) * multiplyer;
    } else {
      totalWeight += types.inputs[key] * inputs[key];
    }
    if (key.indexOf("W") >= 0) hasWitness = true;
  });

  Object.keys(outputs).forEach(function (key) {
    totalWeight += types.outputs[key] * outputs[key];
  });

  if (hasWitness) totalWeight += 2;

  totalWeight += 10 * 4;

  return Math.ceil(totalWeight / 4);
};

const separateUtxos = (arr) => {
  const withToken = [];
  const withoutToken = [];

  arr.forEach((item) => {
    if (item.token === undefined) {
      withoutToken.push(item);
    } else {
      withToken.push(item);
    }
  });

  return { withToken, withoutToken };
};

const collectUTXOs = (arr, requestedAmount, limitAmount) => {
  let totalSatoshis = 0n;
  const collectedObjects = [];

  // console.log(arr);

  for (const item of arr) {
    // Only add item if its satoshis are less than the limitAmount
    if (item.satoshis < limitAmount) {
      collectedObjects.push(item);
      totalSatoshis += item.satoshis;
    }

    if (totalSatoshis >= requestedAmount) {
      return { collectedObjects, totalSatoshis };
    }
  }

  throw new Error(
    "Not enough satoshis in the UTXO set to meet the requested amount"
  );
};

run();
