import {
  Contract,
  ElectrumNetworkProvider,
  TransactionBuilder,
  Network,
  SignatureTemplate,
} from "cashscript";
import { compileFile } from "cashc";
import {
  // using "alice" keys for setting up contract
  aliceAddress,
  // aliceTokenAddress,
  alicePub,
  alicePriv,
  alicePkh,
  aliceTokenAddress,
  aliceWIF,
  // aliceNode,
  // aliceWIF,
  // bobAddress,
  // bobTokenAddress,
  // bobPriv,
  // bobPkh,
  // bobPub,
} from "./common.js";
import { URL } from "url";

const sendAmount = 10000n; // need to be dynamic in the future
const transactionFee = 422n; // calculated with line 108

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

const collectUTXOs = (arr, requestedAmount) => {
  let totalSatoshis = 0n;
  const collectedObjects = [];

  for (const item of arr) {
    collectedObjects.push(item);
    totalSatoshis += item.satoshis;
    if (totalSatoshis >= requestedAmount) {
      return { collectedObjects, totalSatoshis };
    }
  }

  throw new Error(
    "Not enough satoshis in the UTXO set to meet the requested amount"
  );
};

async function run() {
  console.log("alice public key", alicePub);
  console.log("alice private key", alicePriv);
  console.log("alice private key wallet import format", aliceWIF);
  console.log("alice public key hash", alicePkh);
  console.log("alice address", aliceAddress);
  console.log("alice token address", aliceTokenAddress);
  const artifact = compileFile(new URL("p2pkh.cash", import.meta.url));
  const provider = new ElectrumNetworkProvider(Network.CHIPNET);
  const contract = new Contract(artifact, [alicePkh], {
    provider: provider,
    addressType: "p2sh32",
  });
  // console.log(contract);
  try {
    const transactionBuilder = new TransactionBuilder({ provider });

    const contractUtxos = await contract.getUtxos();
    const {
      // withToken: tokenUTXO,
      withoutToken: regularUTXO,
    } = separateUtxos(contractUtxos);
    const contractBalance = await contract.getBalance();

    const {
      collectedObjects: contractSpendUTXOs,
      totalSatoshis: satoshiAmount,
    } = collectUTXOs(regularUTXO, contractBalance);

    // console.log(contractSpendUTXOs);
    // console.log(satoshiAmount);

    const unlockableContractUtxos = contractSpendUTXOs.map((item) => ({
      ...item,
      unlocker: contract.unlock.spend(
        // abi function name
        alicePub, // first input
        new SignatureTemplate(alicePriv) // second input
      ),
    }));

    const contractTxOutputs = [
      {
        to: contract.address,
        amount: satoshiAmount - sendAmount - transactionFee,
        // token: {amount: tokenUTXO[0].amount, category: tokenUTXO[0].token.category}
      },
      { to: aliceAddress, amount: sendAmount },
    ];

    transactionBuilder
      .addInputs(unlockableContractUtxos)
      .addOutputs(contractTxOutputs);

    // console.log(transactionBuilder.build().length / 2);

    // // Send the transaction
    // const sendTx = await transactionBuilder.send();

    // // Log the transaction details
    // console.log(`Transaction detail: `, sendTx.txid);
  } catch (error) {
    console.log(error);
  }
}

const hexString = (pkh) => {
  return Array.from(pkh, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

run();
