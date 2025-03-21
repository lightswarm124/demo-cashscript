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

const hexString = (pkh) => {
  return Array.from(pkh, (byte) => byte.toString(16).padStart(2, "0")).join("");
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

const sendAmount = 687n; // need to be dynamic in the future
const transactionFee = 302n; // calculated with line 108

async function initialize() {
  // console.log("alice public key", alicePub);
  // console.log("alice private key", alicePriv);
  // console.log("alice private key wallet import format", aliceWIF);
  // console.log("alice public key hash", alicePkh);
  // console.log("alice address", aliceAddress);
  // console.log("alice token address", aliceTokenAddress);
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

    console.log(contractSpendUTXOs);
    console.log(satoshiAmount);

    const unlockableContractUtxos = contractSpendUTXOs.map((item) => ({
      ...item,
      // abi function name
      unlocker: contract.unlock.spend(
        alicePub, // first input
        new SignatureTemplate(alicePriv) // second input
      ),
    }));

    const contractTxOutputs = [
      {
        to: contract.address,
        amount: sendAmount,
        // token: {amount: tokenUTXO[0].amount, category: tokenUTXO[0].token.category}
      },
      { to: aliceAddress, amount: satoshiAmount - sendAmount - transactionFee },
    ];

    transactionBuilder
      .addInputs(unlockableContractUtxos)
      .addOutputs(contractTxOutputs);

    console.log(transactionBuilder);

    console.log(transactionBuilder.build().length / 2);

    // // Send the transaction
    // const sendTx = await transactionBuilder.send();

    // // Log the transaction details
    // console.log(`Transaction detail: `, sendTx.txid);
  } catch (error) {
    console.log(error);
  }
}

async function createCashToken() {
  console.log("alice token address", aliceTokenAddress);

  const artifact = compileFile(new URL("p2pkh.cash", import.meta.url));
  const provider = new ElectrumNetworkProvider(Network.CHIPNET);
  const contract = new Contract(artifact, [alicePkh], {
    provider: provider,
    addressType: "p2sh32",
  });

  const contractBalance = await contract.getBalance();

  try {
    const transactionBuilder = new TransactionBuilder({ provider });
    const contractUtxos = await contract.getUtxos();
    console.log(contractUtxos);

    const unlockableContractUtxos = contractUtxos.map((item) => ({
      ...item,
      // abi function name
      unlocker: contract.unlock.spend(
        alicePub, // first input
        new SignatureTemplate(alicePriv) // second input
      ),
    }));

    const contractTxOutputs = [
      {
        to: contract.address,
        amount: contractBalance - sendAmount - transactionFee,
      },
      {
        to: contract.tokenAddress,
        amount: sendAmount,
        token: { amount: 420n, category: contractUtxos[0].txid },
      },
    ];

    transactionBuilder
      .addInputs(unlockableContractUtxos)
      .addOutputs(contractTxOutputs);

    console.log(transactionBuilder);
    console.log(transactionBuilder.build().length / 2);

    // Send the transaction
    const sendTx = await transactionBuilder.send();

    // Log the transaction details
    console.log(`Transaction detail: `, sendTx.txid);
  } catch (error) {
    console.log(error);
  }
}

async function testing() {
  const artifact = compileFile(new URL("p2pkh.cash", import.meta.url));
  const provider = new ElectrumNetworkProvider(Network.CHIPNET);
  const contract = new Contract(artifact, [alicePkh], {
    provider: provider,
    addressType: "p2sh32",
  });

  const contractBalance = await contract.getBalance();

  try {
    const transactionBuilder = new TransactionBuilder({ provider });
    const contractUtxos = await contract.getUtxos();
    console.log(contractUtxos);

    const filteredUtxos = contractUtxos.filter((item) => !item.token);
    const tokenFilteredUtxos = contractUtxos.filter(
      (item) =>
        item.token?.category ===
        "d599613b00b7366c9fe4088f0e357c287c9e4988a3ed9afb2b142d7ced4eb5dc"
    );

    const unlockableContractUtxos = filteredUtxos.map((item) => ({
      ...item,
      // abi function name
      unlocker: contract.unlock.spend(
        alicePub, // first input
        new SignatureTemplate(alicePriv) // second input
      ),
    }));

    const unlockableContractTokenUtxos = tokenFilteredUtxos.map((item) => ({
      ...item,
      // abi function name
      unlocker: contract.unlock.spend(
        alicePub, // first input
        new SignatureTemplate(alicePriv) // second input
      ),
    }));

    const contractTxOutputs = [
      // reset for fresh minting vout[0]
      {
        to: contract.address,
        amount:
          unlockableContractUtxos[0].satoshis -
          sendAmount * 3n -
          transactionFee,
      },
      // minting new genesis NFT tokens
      {
        to: aliceTokenAddress,
        amount: sendAmount,
        token: {
          category: contractUtxos[0].txid,
          nft: {
            capability: "none",
            commitment: "ffffffffffffffffffffffffffffffff",
          },
        },
      },
      // // minting new genesis tokens
      // {
      //   to: aliceTokenAddress,
      //   amount: sendAmount,
      //   token: { amount: 69n, category: contractUtxos[0].txid },
      // },
      // transfer existing tokens
      {
        to: aliceTokenAddress,
        amount: sendAmount,
        token: {
          amount: 69n,
          category: contractUtxos[1].token.category,
        },
      },
      // transfer token remainder
      {
        to: contract.tokenAddress,
        amount: sendAmount,
        token: { amount: 31n, category: contractUtxos[1].token.category },
      },
    ];

    transactionBuilder
      // .addInputs(unlockableContractUtxos)
      .addInputs(unlockableContractTokenUtxos)
      .addInputs(unlockableContractUtxos)
      .addOutputs(contractTxOutputs);

    console.log(transactionBuilder);

    console.log(transactionBuilder);
    console.log(transactionBuilder.build().length / 2);

    // Send the transaction
    // const sendTx = await transactionBuilder.send();

    // // Log the transaction details
    // console.log(`Transaction detail: `, sendTx.txid);
  } catch (error) {
    console.log(error);
  }
}

createCashToken();
