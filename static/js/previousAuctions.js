let globalAuctions = []; // This will store the auctions fetched from the server

async function updateLots() {
    try {
        const groupIds = [62007, 60309, 63759, 69639, 73072, 73121]; // Define the Group IDs to fetch
        const apiUrl = '/api/proxy/online-auctions';
        const allAuctions = [];

        // Fetch data for each GroupId
        for (const groupId of groupIds) {
            const params = new URLSearchParams({
                OnlineAuctionGroupId: groupId,  // Pass the current group ID
                IsShownOnWeb: true,
            });

            const response = await fetch(`${apiUrl}?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`Network response for GroupId ${groupId} was not ok`);
            }

            const responseBody = await response.json();
            const auctions = responseBody.Auctions;

            if (!Array.isArray(auctions)) {
                throw new Error('Response is not an array');
            }

            // Add the auctions to the allAuctions array
            allAuctions.push(...auctions);
        }

        // Group auctions by GroupId (60309, 63759, 62007, 69639. 73072, 73121 - 65993 removed)
        const auctionsByGroupId = allAuctions.reduce((groups, auction) => {
            const groupId = auction.GroupId;
            if (groupId === 60309 || groupId === 62007 || groupId === 63759 || groupId === 69639 || groupId === 73072 || groupId === 73121) {
                groups[groupId] = groups[groupId] || [];
                groups[groupId].push(auction);
            }
            return groups;
        }, {});

        const auctionsContainer = document.querySelector('#auctions-container');
        auctionsContainer.innerHTML = ''; // Clear existing content

        // Process each group (62007 and 60309)
        Object.entries(auctionsByGroupId).forEach(([groupId, auctions], index) => {
            const offeredAuctions = auctions.filter(auction => auction.SoldStatus !== "Withdrawn" && auction.SoldStatus !== "Postponed");
            const soldAuctions = auctions.filter(auction => auction.SoldStatus === "Sold");

            const totalOffered = offeredAuctions.length;
            const totalSold = soldAuctions.length;
            const successRate = totalSold / totalOffered * 100;
            const totalRaised = soldAuctions.reduce((acc, auction) => acc + (auction.SalePrice || 0), 0);

            const formattedRaised = new Intl.NumberFormat('en-GB', { 
                style: 'currency', 
                currency: 'GBP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0 
            }).format(totalRaised);

            // Map GroupId to readable date
            const formattedEndDate = 
            groupId === "60309" ? "16th July 2024" : 
            groupId === "62007" ? "8th October 2024" : 
            groupId === "63759" ? "12th November 2024" :
            groupId === "69639" ? "13th May 2025" :
            groupId === "73072" ? "5th August 2025" :
            groupId === "73121" ? "30th September 2025" : "Unknown Date";
            const groupIdIndex = `group-${index}`;

            // Header HTML includes dynamic stats for each group
            const headerHtml = `
            <div class="accordion-item">
                <h6 class="accordion-header" id="heading${groupIdIndex}">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${groupIdIndex}" aria-expanded="true" aria-controls="collapse${groupIdIndex}">
                        <strong>
                            <span class="info-date">Auction Date: ${formattedEndDate}</span>
                        </strong>
                    </button>
                    <div class="list-group align-items-start pl-20">
                        <span class="info-offered"><strong>Offered:</strong> ${totalOffered}</span>
                        <span class="info-sold"><strong>Sold:</strong> ${totalSold}</span>
                        <span class="info-success"><strong>Success:</strong> ${successRate.toFixed(2)}%</span>
                        <span class="info-raised"><strong>Raised:</strong> ${formattedRaised}</span><br>
                    </div>
                </h6>
                <div id="collapse${groupIdIndex}" class="accordion-collapse collapse" aria-labelledby="heading${groupIdIndex}" data-bs-parent="#auctions-container">
                    <div class="accordion-body">
                        <div id="lots-container" class="row row-cols-1 row-cols-md-3 d-flex">`;

            let propertiesHtml = auctions.map(auction => {
                const shouldHidePrice = auction.LotNumber === 14 || auction.LotNumber === 15 || auction.SoldStatusStage === 2 || auction.SoldStatus === "No Bids" || auction.SoldStatus === "Unsold";
                const formattedPrice = new Intl.NumberFormat('en-GB', { 
                    style: 'currency', 
                    currency: 'GBP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0 
                }).format(auction.SalePrice);
                const detailsUrl = auction.LotDetailsUrl || '#';
                const description = auction.Tagline.replace("TEST PROPERTY, ", "") || 'No description available.';
                const streetNumber = auction.StreetNumber || '';
                const streetName = auction.StreetName || '';
                const streetName2 = auction.StreetName2 || '';
                const town = auction.Town || '';
                const county = auction.County || '';
                const postCode = auction.PostCode || '';
                
                return `
                    <div class="col">
                        <div class="fbox-8 mb-40 wow fadeInUp position-relative">
                            <!-- Lot Number Banner -->
                            <div class="lot-banner position-absolute" style="top: 0; left: 0; padding: 5px 10px;">
                                Lot ${auction.SoldStatus}
                            </div>
                            <div class="fbox-img bg-white">
                                <img class="img-fluid" src="${auction.Thumbnail || 'static/images/lotsimg.png'}" alt="feature-icon" style="width: 100%; height: auto; max-height: 300px; object-fit: cover;" />
                            </div>
                            <div class="lot-details p-3">
                                <h6 class="text-left"><strong>${streetNumber} ${streetName}, ${streetName2}</strong></h6>
                                <h6 class="text-left"><strong>${town}, ${county}, ${postCode}</strong></h6>
                                <p class="p-md text-black text-left">${description}</p>
                                <p class="p-md text-black text-left">
                                    <strong>End Date: <span class="red-color">
                                    ${auction.EndDate
                                        ? new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(auction.EndDate))
                                        : 'N/A'}
                                    </span></strong>
                                </p>
                                ${!shouldHidePrice ? `<h6 class="h6-md text-left"><strong>Sold For: ${formattedPrice}</strong></h6>` : ''}
                                <div class="row justify-content-center text-center">
                                    <p class="p-lg txt-upcase">
                                        <a href="${detailsUrl}" target="_blank" class="btn btn-md btn-tra-black blue-hover">View Details</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>`;
            }).join('');

            const footerHtml = `</div> <!-- End of lots-container -->
            </div>
            </div>
            </div>`;

            // Combine HTML parts and append to the container
            auctionsContainer.insertAdjacentHTML('beforeend', headerHtml + propertiesHtml + footerHtml);
        });

    } catch (error) {
        console.error('Error fetching lots:', error);
    }
}


document.addEventListener('DOMContentLoaded', updateLots);

function renderAuctions(auctionsToRender) {
  const auctionsContainer = document.querySelector('#auctions-container');
  auctionsContainer.innerHTML = '';

  if (auctionsToRender.length === 0) {
      auctionsContainer.innerHTML = '<p class="p-lg txt-700">No auctions available.</p>';
      return;
  }

  // Assumes a similar structure function for auctionsToRender.forEach similar to renderLots
}

function attachFilterEvent() {
  document.getElementById('apply-filter-button').addEventListener('click', updateFilteredAuctions);
  document.getElementById('reset-filter-button').addEventListener('click', function() {
      resetFilters();
      renderAuctions(globalAuctions); // Resets to show all auctions
  });
}

function resetFilters() {
  document.getElementById('auction-address-filter').value = '';
  document.getElementById('max-price-filter').value = '';
  document.getElementById('auction-type-filter').value = '';
}

function updateFilteredAuctions() {
  const addressValue = document.getElementById('auction-address-filter').value;
  let maxPriceValue = document.getElementById('max-price-filter').value;
  const auctionTypeValue = document.getElementById('auction-type-filter').value;
  
  const filteredAuctions = filterAuctions({
      address: addressValue,
      maxPrice: maxPriceValue.length > 0 ? Number(maxPriceValue.replace(/[£,]+/g, '')) : undefined,
      auctionType: auctionTypeValue,
  });

  renderAuctions(filteredAuctions);
}

function filterAuctions(criteria) {
  return globalAuctions.filter((auction) => {
      const fullAddress = `${auction.StreetNumber}, ${auction.StreetName}, ${auction.StreetName2}, ${auction.Town}, ${auction.County}, ${auction.PostCode}`.toLowerCase();
      const finalPrice = `${auction.SalePrice}`;
      let matchesCriteria = true;

      if (criteria.address && !fullAddress.includes(criteria.address.toLowerCase())) {
          matchesCriteria = false;
      }

      if (criteria.maxPrice && finalPrice > criteria.maxPrice) {
          matchesCriteria = false;
      }

      // Assuming auctionType is a meaningful filter derived from content
      if (criteria.auctionType && auction.AuctionType !== criteria.auctionType) {
          matchesCriteria = false;
      }

      return matchesCriteria;
  });
}

document.getElementById('auctions-filter-form').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent the default form submission
  updateFilteredAuctions();
});

document.addEventListener('DOMContentLoaded', async () => {
  try {
      await updateLots();
      attachFilterEvent();
  } catch (error) {
      console.error('Initialization failed:', error);
  }
});
