const express = require('express');
const axios = require('axios');
const cors = require('cors');
const xml2js = require('xml2js');
const path = require('path');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 9990;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to fetch world gold price
app.get('/api/gold', async (req, res) => {
    try {
        const response = await axios.get('https://api.gold-api.com/price/XAU');
        res.json({ price: parseFloat(response.data.price) });
    } catch (error) {
        console.error('Error fetching gold price:', error.message);
        res.status(500).json({ error: 'Failed to fetch world gold price' });
    }
});
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
// Endpoint to fetch USD rate from Vietcombank
app.get('/api/usd-rate', async (req, res) => {
    try {
        const response = await axios.get('https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        xml2js.parseString(response.data, { explicitArray: false }, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to parse XML' });
            }

            try {
                const exrates = result.ExrateList.Exrate;
                const usdData = exrates.find(rate => rate.$.CurrencyCode === 'USD');

                if (usdData) {
                    // Extract sell rate and remove commas
                    const sellRate = parseFloat(usdData.$.Sell.replace(/,/g, ''));
                    res.json({ rate: sellRate });
                } else {
                    res.status(404).json({ error: 'USD rate not found' });
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to process XML data structure' });
            }
        });
    } catch (error) {
        console.error('Error fetching exchange rate:', error.message);
        res.status(500).json({ error: 'Failed to fetch exchange rate' });
    }
});

// Endpoint to fetch Ngọc Như Ý gold price
app.get('/api/vangngocnhuy', async (req, res) => {
    try {
        const response = await axios.get('https://vangngocnhuy.com/gia-vang', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(response.data);
        const prices = [];

        $('.khung_giavang1 .item_gv').each((i, el) => {
            if (i === 0) return; // Skip header row

            const cols = $(el).find('.col-4');
            if (cols.length >= 3) {
                const type = $(cols[0]).text().trim();
                const buy = $(cols[1]).text().trim();
                const sell = $(cols[2]).text().trim();

                if (type) {
                    prices.push({
                        type,
                        buy: buy || '-',
                        sell: sell || '-'
                    });
                }
            }
        });

        res.json({ prices });
    } catch (error) {
        console.error('Error fetching Ngọc Như Ý gold price:', error.message);
        res.status(500).json({ error: 'Failed to fetch Ngọc Như Ý gold price' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
