import {
    Contract,
    ElectrumNetworkProvider,
    TransactionBuilder,
    Network,
    SignatureTemplate,
} from "cashscript";
import { compileFile } from "cashc";
import { URL } from "url";
import { cashAddressToLockingBytecode, lockingBytecodeToCashAddress, hexToBin, binToHex, hash256 } from "@bitauth/libauth-v3";
import {
  aliceAddress,
  aliceTokenAddress,
  alicePkh,
  alicePriv,
  bobAddress,
  bobTokenAddress,
  bobPriv,
  alicePub,
} from "./common.js";
import { DataSigner } from './dataSigner.js';

async function run(password) {
    const provider = new ElectrumNetworkProvider(Network.CHIPNET);
    const artifact = compileFile(new URL("bip38.cash", import.meta.url));

    const dataSig = new DataSigner(alicePriv);
    const oracleMessage = dataSig.createMessage(password)
    console.log(oracleMessage)
    const oracleSignature = dataSig.signMessage(oracleMessage)
    console.log(oracleSignature)

    const contract = new Contract(artifact, [oracleSignature], {
        provider: provider,
        addressType: "p2sh32",
    });

    console.log(contract.address)
}

run("password")