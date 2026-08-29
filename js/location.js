const countySelect = document.getElementById("county");
const subCountySelect = document.getElementById("subcounty");
const wardSelect = document.getElementById("ward");

const latitudeInput = document.getElementById("latitude");
const longitudeInput = document.getElementById("longitude");
const locationIdInput = document.getElementById("locationId");

/*
------------------------------------
Load Counties
------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    loadCounties
);

async function loadCounties() {

    try {

        const response = await fetch(
            `${window.API_BASE_URL}/locations/counties`
        );

        const result = await response.json();

        countySelect.innerHTML =
            '<option value="">Select County</option>';

        result.data.forEach(location => {

            countySelect.innerHTML += `
                <option value="${location.county}">
                    ${location.county}
                </option>
            `;

        });

    } catch (error) {

        console.error(error);

    }

}

countySelect.addEventListener(
    "change",
    loadSubCounties
);

async function loadSubCounties() {

    const county =
        countySelect.value;

    subCountySelect.innerHTML =
        '<option value="">Select Sub-county</option>';

    wardSelect.innerHTML =
        '<option value="">Select Ward</option>';

    wardSelect.disabled = true;

    if (!county) {

        subCountySelect.disabled = true;

        return;

    }

    try {

        const response =
            await fetch(
                `${window.API_BASE_URL}/locations/subcounties/${encodeURIComponent(county)}`
            );

        const result =
            await response.json();

        result.data.forEach(item => {

            subCountySelect.innerHTML += `
                <option value="${item.sub_county}">
                    ${item.sub_county}
                </option>
            `;

        });

        subCountySelect.disabled = false;

    } catch (error) {

        console.error(error);

    }

}

subCountySelect.addEventListener(
    "change",
    loadWards
);

async function loadWards() {

    const county =
        countySelect.value;

    const subCounty =
        subCountySelect.value;

    wardSelect.innerHTML =
        '<option value="">Select Ward</option>';

    if (!subCounty) {

        wardSelect.disabled = true;

        return;

    }

    try {

        const response =
            await fetch(

`${window.API_BASE_URL}/locations/wards/${encodeURIComponent(county)}/${encodeURIComponent(subCounty)}`

            );

        const result =
            await response.json();

        result.data.forEach(item => {

            wardSelect.innerHTML += `
                <option value="${item.ward}">
                    ${item.ward}
                </option>
            `;

        });

        wardSelect.disabled = false;

    } catch (error) {

        console.error(error);

    }

}

wardSelect.addEventListener(
    "change",
    loadCoordinates
);

async function loadCoordinates() {

    const county =
        countySelect.value;

    const subCounty =
        subCountySelect.value;

    const ward =
        wardSelect.value;

    if (!ward) return;

    try {

        const response =
            await fetch(

`${window.API_BASE_URL}/locations/coordinates?county=${encodeURIComponent(county)}&subCounty=${encodeURIComponent(subCounty)}&ward=${encodeURIComponent(ward)}`

            );

        const result =
            await response.json();

        if (!result.success) {

            return;

        }

        const status = document.getElementById("location-status");

status.textContent = "📍 Location verified successfully.";
status.style.color = "#2e7d32";


        latitudeInput.value =
            result.data.latitude;

        longitudeInput.value =
            result.data.longitude;

        if (locationIdInput && result.data.id) {

            locationIdInput.value =
                result.data.id;

        }

    } catch (error) {

        console.error(error);

    }

}