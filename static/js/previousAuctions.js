let globalAuctions = []; // All lots fetched from the server

// Groups you care about
const PREVIOUS_GROUP_IDS = [62007, 60309, 63759, 69639, 73072, 73121];
const API_URL = '/api/proxy/online-auctions';

// ================= MAIN FETCH / INITIAL RENDER =================

async function updateLots() {
  try {
    const allAuctions = [];

    // Fetch data for each GroupId
    for (const groupId of PREVIOUS_GROUP_IDS) {
      const params = new URLSearchParams({
        OnlineAuctionGroupId: groupId,
        IsShownOnWeb: true,
      });

      const response = await fetch(`${API_URL}?${params.toString()}`);
      if (!response.ok) {
        console.error(`Network response for GroupId ${groupId} was not ok`);
        continue;
      }

      const responseBody = await response.json();
      const auctions = responseBody.Auctions;

      if (!Array.isArray(auctions)) {
        console.error('Response for GroupId', groupId, 'is not an array');
        continue;
      }

      allAuctions.push(...auctions);
    }

    globalAuctions = allAuctions;

    // Render all auctions in the new card layout
    renderAuctions(globalAuctions);

  } catch (error) {
    console.error('Error fetching lots:', error);
  }
}

// ================= RENDER CARDS (NEW LAYOUT) =================

function renderAuctions(auctionsToRender) {
  const auctionsContainer = document.querySelector('#auctions-container');
  if (!auctionsContainer) return;

  auctionsContainer.innerHTML = '';

  if (!auctionsToRender || auctionsToRender.length === 0) {
    auctionsContainer.innerHTML = '<p class="p-lg txt-700">No auctions available.</p>';
    return;
  }

  // Group by GroupId, but only the GroupIds we care about
  const auctionsByGroupId = auctionsToRender.reduce((groups, auction) => {
    const groupId = auction.GroupId;
    if (PREVIOUS_GROUP_IDS.includes(groupId)) {
      if (!groups[groupId]) groups[groupId] = [];
      groups[groupId].push(auction);
    }
    return groups;
  }, {});

  // For each group, build one “Market Highlights” card
  Object.entries(auctionsByGroupId).forEach(([groupId, auctions]) => {
    const cardHtml = buildPreviousAuctionCard(groupId, auctions);
    auctionsContainer.insertAdjacentHTML('beforeend', cardHtml);
  });
}

// Build a single summary card for one GroupId
function buildPreviousAuctionCard(groupId, auctions) {
  // Filter out withdrawn / postponed for stats
  const offeredAuctions = auctions.filter(
    (auction) => auction.SoldStatus !== 'Withdrawn' && auction.SoldStatus !== 'Postponed'
  );
  const soldAuctions = offeredAuctions.filter(
    (auction) => auction.SoldStatus === 'Sold'
  );

  const totalOffered = offeredAuctions.length;
  const totalSold = soldAuctions.length;
  const successRate = totalOffered > 0 ? (totalSold / totalOffered) * 100 : 0;

  const totalRaised = soldAuctions.reduce(
    (acc, auction) => acc + (auction.SalePrice || 0),
    0
  );

  const formattedRaised = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalRaised);

  const auctionDateRange = formatAuctionDateRange(auctions);

  // 🔁 TODO: update this to whatever URL shows the lot list for this past auction
  const viewLotsUrl = '#'; // e.g. `${window.location.origin}/previous_auctions?groupId=${groupId}`

  const wantToSellUrl = `${window.location.origin}/valuation`;

  return `
    <div class="col-12 col-md-6 col-lg-4 mb-4">
      <div class="prev-auction-card wow fadeInUp">

        <!-- Swift badge (top-left) -->
        <div class="prev-auction-badge">
          <img
            src="static/images/swift-card-badge.svg"
            alt="THE SWIFT PROPERTY AUCTIONS TEAM"
          >
        </div>

        <!-- Market Highlights pill (top-right) -->
        <div class="prev-auction-pill">
          Market Highlights
        </div>

        <!-- Card body -->
        <div class="prev-auction-body">
          <div class="prev-auction-row">
            <img
              src="static/images/icon-calendar.svg"
              alt=""
              class="prev-auction-icon"
            >
            <span class="prev-auction-label">Auction:</span>
            <span class="prev-auction-value prev-auction-value-red">
              ${auctionDateRange}
            </span>
          </div>

          <div class="prev-auction-row">
            <img
              src="static/images/icon-trend.svg"
              alt=""
              class="prev-auction-icon"
            >
            <span class="prev-auction-label">Sale Rate:</span>
            <span class="prev-auction-value prev-auction-value-red">
              ${Math.round(successRate)}%
            </span>
          </div>

          <div class="prev-auction-row">
            <img
              src="static/images/icon-pound.svg"
              alt=""
              class="prev-auction-icon"
            >
            <span class="prev-auction-label">Total Raised:</span>
            <span class="prev-auction-value prev-auction-value-red">
              ${formattedRaised}
            </span>
          </div>
        </div>

        <!-- Footer buttons -->
        <div class="prev-auction-footer">
          <!-- If you have SVG button assets, drop them in these <a> tags -->
          <a href="${viewLotsUrl}" class="prev-auction-btn prev-auction-btn-view">
            View Lots
          </a>

          <a href="${wantToSellUrl}" class="prev-auction-btn prev-auction-btn-sell">
            Want to Sell?
          </a>
        </div>
      </div>
    </div>
  `;
}

// ================= DATE HELPERS =================

// Turn a group of lots into something like: "12-13 Nov 2025"
function formatAuctionDateRange(auctions) {
  const dates = auctions
    .map((a) => (a.EndDate ? new Date(a.EndDate) : null))
    .filter((d) => d && !isNaN(d));

  if (!dates.length) return 'Unknown Date';

  const min = new Date(Math.min(...dates));
  const max = new Date(Math.max(...dates));

  const day1 = min.getDate();
  const day2 = max.getDate();
  const monthShort1 = min.toLocaleString('en-GB', { month: 'short' });
  const year1 = min.getFullYear();

  const sameDay = min.toDateString() === max.toDateString();
  const sameMonthYear =
    min.getMonth() === max.getMonth() && min.getFullYear() === max.getFullYear();

  if (sameDay) {
    // 12 Nov 2025
    return `${day1} ${monthShort1} ${year1}`;
  }

  if (sameMonthYear) {
    // 12-13 Nov 2025
    return `${day1}-${day2} ${monthShort1} ${year1}`;
  }

  const monthShort2 = max.toLocaleString('en-GB', { month: 'short' });
  const year2 = max.getFullYear();

  // 30 Sep 2025 - 1 Oct 2025 (fallback if it straddles months/years)
  return `${day1} ${monthShort1} ${year1} - ${day2} ${monthShort2} ${year2}`;
}

// ================= FILTER LOGIC (REUSED) =================

function attachFilterEvent() {
  const applyBtn = document.getElementById('apply-filter-button');
  const resetBtn = document.getElementById('reset-filter-button');

  if (applyBtn) {
    applyBtn.addEventListener('click', updateFilteredAuctions);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      resetFilters();
      renderAuctions(globalAuctions); // Resets to show all auctions
    });
  }
}

function resetFilters() {
  const addressInput = document.getElementById('auction-address-filter');
  const maxPriceInput = document.getElementById('max-price-filter');
  const typeSelect = document.getElementById('auction-type-filter');

  if (addressInput) addressInput.value = '';
  if (maxPriceInput) maxPriceInput.value = '';
  if (typeSelect) typeSelect.value = '';
}

function updateFilteredAuctions() {
  const addressInput = document.getElementById('auction-address-filter');
  const maxPriceInput = document.getElementById('max-price-filter');
  const typeSelect = document.getElementById('auction-type-filter');

  const addressValue = addressInput ? addressInput.value : '';
  let maxPriceValue = maxPriceInput ? maxPriceInput.value : '';
  const auctionTypeValue = typeSelect ? typeSelect.value : '';

  const filteredAuctions = filterAuctions({
    address: addressValue,
    maxPrice:
      maxPriceValue && maxPriceValue.length > 0
        ? Number(maxPriceValue.replace(/[£,]+/g, ''))
        : undefined,
    auctionType: auctionTypeValue,
  });

  renderAuctions(filteredAuctions);
}

function filterAuctions(criteria) {
  return globalAuctions.filter((auction) => {
    const fullAddress = `${auction.StreetNumber}, ${auction.StreetName}, ${auction.StreetName2}, ${auction.Town}, ${auction.County}, ${auction.PostCode}`.toLowerCase();
    const finalPrice = auction.SalePrice || 0;
    let matchesCriteria = true;

    if (criteria.address && !fullAddress.includes(criteria.address.toLowerCase())) {
      matchesCriteria = false;
    }

    if (criteria.maxPrice && finalPrice > criteria.maxPrice) {
      matchesCriteria = false;
    }

    if (criteria.auctionType && auction.AuctionType !== criteria.auctionType) {
      matchesCriteria = false;
    }

    return matchesCriteria;
  });
}

// ================= INIT =================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await updateLots();

    // Only wire filters if the form exists on this page
    const filterForm = document.getElementById('auctions-filter-form');
    if (filterForm) {
      filterForm.addEventListener('submit', function (event) {
        event.preventDefault();
        updateFilteredAuctions();
      });
      attachFilterEvent();
    }
  } catch (error) {
    console.error('Initialization failed:', error);
  }
});
