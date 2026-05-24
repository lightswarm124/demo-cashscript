import {
  ElectrumClient,
  ElectrumTransport,
//   RequestResponse,
} from 'electrum-cash';

const ElectrumServer = async () => {
    let electrum
    const connect = async () => {
        electrum = new ElectrumClient(
            'OPTNWallet',
            '1.4.1',
            'chipnet.bch.ninja',
            50004,
            ElectrumTransport.WSS.Scheme
        )

        await electrum.connect();
    }

    connect().then(async() => { 
        const response = await electrum.request('blockchain.headers.get_tip')
        console.log(response)
    })
    // return electrum
}

ElectrumServer()