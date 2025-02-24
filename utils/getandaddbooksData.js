const getAndSetBookData = async(marketIds) => {
    let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/books/${marketIds}`,{
        method: 'GET',
        headers: {
            'Content-type': 'application/json',
        }
    })
    let fetchMarketDatajson = await fetchMarketData.json()
    return fetchMarketDatajson
}

module.exports = getAndSetBookData

