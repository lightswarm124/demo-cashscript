import axios from 'axios';

const fetchBitcoinPrice = async () => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'usd'
      }
    });
    const bitcoinPrice = response.data.bitcoin.usd;
    console.log(`Current Bitcoin Price: $${bitcoinPrice}`);
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
  }
};

fetchBitcoinPrice();
