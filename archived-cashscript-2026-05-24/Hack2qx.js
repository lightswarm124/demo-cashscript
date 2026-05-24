import {
    Contract,
    ElectrumNetworkProvider,
    TransactionBuilder,
    Network,
    SignatureTemplate,
} from "cashscript";
import { compileFile } from "cashc";
import { cashAddressToLockingBytecode, lockingBytecodeToCashAddress, hexToBin, binToHex, hash256 } from "@bitauth/libauth";

async function run() {
    const provider = new ElectrumNetworkProvider(Network.MAINNET);
    const artifact = compileFile(new URL("Hack2qx.cash", import.meta.url));

    const contract = new Contract(artifact, [], {
        provider: provider,
        addressType: "p2sh32",
    });

    const bytecode = "76a9143ada409596ff14e9980aaba6f3f0c99f5306a77088ac";
    const bytecodearray = hexToBin(bytecode);
    // console.log(bytecodearray)

    const address = "bitcoincash:qqad5sy4jml3f6vcp246dulsex04xp48wq23d35rqe"

    // console.log(contract.address);
    const utxos = await contract.getUtxos();
    // console.log(contract.bytecode)
    console.log(utxos);

    // const testLockingBytecodeArray = lockingBytecodeToCashAddress ({bytecode: bytecodearray, prefix: "bitcoincash", tokenSupport: false})
    // const testAddress = testLockingBytecodeArray.address
    
    // const lockbytecode = cashAddressToLockingBytecode(address)
    // console.log(binToHex(lockbytecode.bytecode))
    // const testContractLockingBytecodeArray = cashAddressToLockingBytecode (contract.address)

    // console.log(testAddress)
    // console.log(binToHex(testContractLockingBytecodeArray.bytecode))
}

run()