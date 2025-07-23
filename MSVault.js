import {
    Contract,
    ElectrumNetworkProvider,
    TransactionBuilder,
    Network,
    SignatureTemplate,
    Transaction,
} from "cashscript";
import { compileFile } from "cashc";
import { URL } from "url";
import { cashAddressToLockingBytecode, lockingBytecodeToCashAddress, hexToBin, binToHex, hash256, locktimeToDate } from "@bitauth/libauth-v3";
import {
  aliceAddress,
  aliceTokenAddress,
  alicePkh,
  alicePub,
  alicePriv,
  bobAddress,
  bobTokenAddress,
  bobPriv,
  bobPkh,
  charliePkh,
  bobPub,
} from "./common.js";
import { DataSigner } from './dataSigner.js';

async function run(password) {
    const provider = new ElectrumNetworkProvider(Network.CHIPNET);
    const artifact = compileFile(new URL("MSVault.cash", import.meta.url));

    const dataSig = new DataSigner(alicePriv);
    const oracleMessage = dataSig.createMessage(password)
    // console.log(oracleMessage)
    const oracleSignature = dataSig.signMessage(oracleMessage)
    // console.log(binToHex(oracleSignature))
    const lockTime = 10000n

    const contract = new Contract(artifact, [
        oracleSignature, 
        lockTime, 
        bobPkh, 
        charliePkh
    ], {
        provider: provider,
        addressType: "p2sh32",
    });

    console.log(contract.address)

    // const balance = await contract.getBalance()
    // // console.log(balance)
    // const utxos = await contract.getUtxos()
    // console.log(utxos)
    // const currentBlockHeight = await provider.getBlockHeight()

    // const txBuilder = new TransactionBuilder({ provider })
    // // txBuilder.addInputs(utxos, contract.unlock.spend(alicePub, new SignatureTemplate(alicePriv), oracleMessage))
    // txBuilder.addInputs(utxos, contract.unlock.unlockVault(bobPub, new SignatureTemplate(bobPriv)))
    // txBuilder.setLocktime(currentBlockHeight)
    // txBuilder.addOutput({
    //     amount: balance - 500n,
    //     to: aliceAddress
    // })  

    // const tx = await txBuilder.send()
    // console.log(tx.txid)
}

run("password")