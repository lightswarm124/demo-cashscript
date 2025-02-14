import {
  Contract,
  ElectrumNetworkProvider,
  TransactionBuilder,
  Network,
  SignatureTemplate,
} from "cashscript";
import { compileFile } from "cashc";
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

// const hexString = (pkh) => {
//   return Array.from(pkh, (byte) => byte.toString(16).padStart(2, "0")).join("");
// };

const run = async () => {
  // ********************************
  // *Initialize Electrum Connection*
  // ********************************
  const provider = new ElectrumNetworkProvider(Network.CHIPNET);

  // ********************************
  // *Retrieve Alice Address Keypair*
  // ********************************

  // ********************************
  // *Initialize Cashscript Contract*
  // ********************************
  const artifact = compileFile(new URL("p2pkh.cash", import.meta.url));
  const contract = new Contract(artifact, [alicePkh], {
    provider: provider,
    addressType: "p2sh32",
  });
  console.log(contract);
  const contractUtxos = await contract.getUtxos();
  console.log(contractUtxos);
  const contractBalance = await contract.getBalance();
  console.log(contractBalance);

  // ********************************
  // *Initialize Transaction Builder*
  // ********************************
  const transactionBuilder = new TransactionBuilder({ provider });
  // transactionBuilder.addInput(contractUtxos[0]);
};

run();
