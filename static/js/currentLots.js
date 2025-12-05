document.addEventListener('DOMContentLoaded', async () => {
    try {
        await updateLots();
        attachFilterEvent();
    } catch (error) {
        console.error('Initialization failed:', error);
    }
  });
  
  let globalLots = []; // This will store the lots fetched from the server
  
  async function updateLots() {
    try {
        const params = new URLSearchParams({
            EndDateTimeFrom: '2025-10-01', // Setting this to the same as Update Lots as EndDatetime should be From AFTER the previous auction to make sure the old lots aren't included
            IsShownOnWeb: true
        });
  
        const apiUrl = '/api/proxy/online-auctions'; // Updated API endpoint
        const response = await fetch(`${apiUrl}?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
  
        const data = await response.json();
        // console.log('Fetched lots:', data); // Log the fetched data
  
        if (!Array.isArray(data.Auctions)) {
            throw new Error('Response is not an array');
        }
        
        globalLots = data.Auctions;
        // globalLots = data.Auctions.filter(lot => lot.SoldStatus !== "Sold"); // Filter out sold lots

        // Sort the lots based on LotId in ascending order
        globalLots.sort((a, b) => {
        //ONE OFF Push LotId 302983 to the end
        // if (a.LotId === 302983) return 1;
        // if (b.LotId === 302983) return -1;

  // Otherwise, sort normally by DisplayOrder
  return a.DisplayOrder - b.DisplayOrder;
});


        renderLots(globalLots);
    } catch (error) {
        console.error('Error fetching or processing lots:', error);
        document.querySelector('#lots-container').innerHTML = '<p>November Listings Will Be Added Shortly.</p>';
    }
  }
  
  function renderLots(lotsToRender) {
    const lotsContainer = document.querySelector('#lots-container');
    lotsContainer.innerHTML = '';

    if (lotsToRender.length === 0) {
        lotsContainer.innerHTML = '<p class="p-lg txt-700">FORTHCOMING LOTS WILL BE ADDED BELOW FOR OUR NEXT AUCTION.</p>';
        return;
    }

    lotsToRender.forEach((lot) => {
        // console.log('Rendering lot:', lot); // Log each lot for debugging

        // Check if the required fields are present
        const description = lot.Tagline || 'No description available.';
        // const detailsUrl = lot.LotDetailsUrl || '#';
        const detailsUrl = `/lot_details/${lot.Id}`;
        const thumbnail = lot.Thumbnail || 'static/images/lotsimg.png';
        const startingPrice = lot.GuidePrice || 'N/A';

        let soldBanner = '';

    // Check if SoldStatus is "Postponed"
    if (lot.SoldStatus === "Postponed") {
      soldBanner = `
          <div class="sold-banner text-white" style="top: 0; right: 0; background-color: red;">
              POSTPONED
          </div>`;
    }

    else if (lot.SoldStatus === "Sold") {
        switch (lot.SoldStatusStage) {
            case 1: // Regular
                soldBanner = `
                    <div class="sold-banner text-white" style="top: 0; right: 0; background-color: red;">
                        SOLD
                    </div>`;
                break;
            case 2: // Prior
                soldBanner = `
                    <div class="sold-banner text-white" style="top: 0; right: 0; background-color: red;">
                        SOLD PRIOR
                    </div>`;
                break;
            case 3: // Post
                soldBanner = `
                    <div class="sold-banner text-white" style="top: 0; right: 0; background-color: red;">
                        SOLD POST
                    </div>`;
                break;
            case 0: // Unknown
            default:
                soldBanner = `
                    <div class="sold-banner text-white" style="top: 0; right: 0; background-color: gray;">
                        SOLD
                    </div>`;
                break;
        }
    }

    // ONE OFF CHECK FOR ID 302983"
    // if (lot.LotId === 302983) {
    //   soldBanner = `
    //       <div class="sold-banner text-white" style="top: 0; right: 0; background-color: red;">
    //           TO BE OFFERED IN SEPTEMBER
    //       </div>`;
    // }

        const addressParts = [
            lot.StreetNumber,
            lot.StreetName,
            lot.StreetName2
        ].filter(part => part && part.trim() !== '');

        const addressLine1 = addressParts.join(' ');
        const addressLine2 = [lot.Town, lot.County, lot.District, lot.PostCode]
            .filter(part => part && part.trim() !== '')
            .join(', ');

        const lotHtml = `
        <div class="col">
        <div class="lot-card position-relative">

          <!-- Lot Number Banner -->
          <div class="lot-banner">
            LOT ${lot.LotNumber}
          </div>

          ${soldBanner}

          <!-- Image -->
          <div class="lot-image">
            <a href="${detailsUrl}" target="_blank">
              <img src="${thumbnail}" alt="property image" />
            </a>
          </div>

          <!-- Content -->
          <div class="lot-content">
            <h5 class="address"><strong>${addressLine1}<br>${addressLine2}</strong></h5>

            <p class="description">${description}</p>

            <p class="price">
              <strong>Guide Price: <span class="red-color">${startingPrice}</span></strong>
            </p>

            <!-- Buttons Row -->
            <div class="btn-row">
              <a href="#" class="btn btn-md btn-gray">Legal Pack</a>

              <a href="${detailsUrl}"
                target="_blank"
                class="btn btn-md btn-red2">
                View Details
              </a>

              <a href="{{ url_for('auction_finance') }}"
                class="btn btn-md btn-gray">
                Finance
              </a>
            </div>
          </div>
        </div>
      </div>
      `;
        document.getElementById('lots-container').insertAdjacentHTML('beforeend', lotHtml);
    });
}


  
  function attachFilterEvent() {
    document.getElementById('apply-filter-button').addEventListener('click', updateFilteredLots);
    document.getElementById('reset-filter-button').addEventListener('click', function() {
      resetFilters();
      updateLots(); // Or re-fetch the lots as per the application's needs
    });
  }
  
  function resetFilters() {
    document.getElementById('lot-address-filter').value = '';
    document.getElementById('max-price-filter').value = '';
    document.getElementById('property-type-filter').value = '';
  }
  
  function updateFilteredLots() {
    const addressValue = document.getElementById('lot-address-filter').value;
    let maxPriceValue = document.getElementById('max-price-filter').value;
    const propertyTypeValue = document.getElementById('property-type-filter').value;
  
    const filteredLots = filterLots({
      address: addressValue,
      maxPrice: maxPriceValue.length > 0 ? Number(maxPriceValue.replace(/[£,]+/g, '')) : undefined,
      propertyType: propertyTypeValue,
    });
  
    renderLots(filteredLots);
  }
  
  function filterLots(criteria) {
    return globalLots.filter((lot) => {
      const fullAddress = `${lot.StreetNumber}, ${lot.StreetName}, ${lot.StreetName2}, ${lot.Town}, ${lot.County}, ${lot.PostCode}`.toLowerCase();
      const startPrice = `${lot.StartingPrice}`;
      let matchesCriteria = true;
      
  
      // Filter by address if search query is provided (case insensitive)
      if (criteria.address && !fullAddress.includes(criteria.address.toLowerCase())) {
        matchesCriteria = false;
      }
  
      // Filter by maximum price
      if (criteria.maxPrice && startPrice > criteria.maxPrice) {
        matchesCriteria = false;
      }
  
      // Filter by property type
      if (criteria.propertyType && criteria.propertyType !== "Property Type" && lot.LotData["Featured Lots Options"] !== criteria.propertyType) {
        matchesCriteria = false;
      }
  
      return matchesCriteria;
    });
  }
  
  document.getElementById('lots-filter-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission
    updateFilteredLots();
  });
  