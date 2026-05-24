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
    const artifact = compileFile(new URL("PriceBet.cash", import.meta.url));

    const contract = new Contract(artifact, ["0251c40ae31baccec147cb9f04f8be7137f1cbed407b2be9a90985c980af005594", 1752658200n, 50000n, "02d09db08af1ff4e8453919cc866a4be427d7bfe18f2c05e5444c196fcf6fd2818"], {
        provider: provider,
        addressType: "p2sh32",
    });

    // const bytecode = "76a9143ada409596ff14e9980aaba6f3f0c99f5306a77088ac";
    // const bytecodearray = hexToBin(bytecode);
    // console.log(bytecodearray)

    // const address = "bitcoincash:qqad5sy4jml3f6vcp246dulsex04xp48wq23d35rqe"

    console.log(contract.address);
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