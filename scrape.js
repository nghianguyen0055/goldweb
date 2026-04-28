const axios = require('axios');
const fs = require('fs');

async function scrape() {
    try {
        const res = await axios.get('https://vangngocnhuy.com/gia-vang');
        fs.writeFileSync('gia-vang.html', res.data);
        console.log("HTML saved to gia-vang.html");
    } catch (e) {
        console.error(e);
    }
}
scrape();
