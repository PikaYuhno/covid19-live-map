let map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let loadingBar = document.getElementById('loadingBar');


const fetchData = async () => {
    const promise = await fetch('https://api.covid19api.com/summary');
    const json = await promise.json();
    return json;
}

let count = 0;
let percent = 0;
const countryLocations = new Map();
const countryGeo = async (json) => {
    const allCountries = [];
    const promise = await fetch('../rsc/data.txt');
    const txt = await promise.text();
    const lines = txt.split(/[\n\r]/g);

    for (let i = 0; i < lines.length; i++) {
        const lineData = lines[i].split("\t");
        countryLocations.set(lineData[0], { "latitude": lineData[1], "longitute": lineData[2], "coutryName": lineData[3] });
        count++;
        if (count % 4 === 0) percent++;
        loadingBar.setAttribute('aria-valuenow', percent);
        loadingBar.setAttribute('style', `width: ${percent}%`);

    }
    const pins = [];
    for (let i = 0; i < json['Countries'].length; i++) {
        let countryData = json['Countries'][i];
        const country = countryLocations.get(countryData.CountryCode);
        if (!country) continue;
        allCountries.push(country);
        let t0 = performance.now();
        let pin = L.marker([country['latitude'], country['longitute']])
            .bindPopup(`NewConfirmed: ${countryData['NewConfirmed']}\nTotalConfirmed: ${countryData['TotalConfirmed']}\nNewDeaths: ${countryData['NewDeaths']}
                    TotalDeaths: ${countryData['TotalDeaths']}\nNewRecovered: ${countryData['NewRecovered']}\nTotalRecovered: ${countryData['TotalRecovered']}\nDate: ${countryData['Date']}`)
            .openPopup();
        pins.push(pin);
        let t1 = performance.now();
        console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.")

    }

    for (let item of pins) {
        item.addTo(map);
        count++;
        if (count % 4 === 0) percent++;
        loadingBar.setAttribute('aria-valuenow', percent);
        loadingBar.setAttribute('style', `width: ${percent}%`);
    }
    console.log('Done');

    return new Promise((res, rej) => {
        res(allCountries);
    });
}


(async () => {
    const data = await fetchData();
    document.getElementById('cases').innerText = data.Global.TotalConfirmed;
    const res = await countryGeo(data);
    if (percent >= 100) {
        document.querySelector('div[class=progress]').setAttribute('style', 'display: none;');
    }
    console.log("Percent:", percent);
})()
