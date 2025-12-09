let globalAuctions = []; // store all *lots* for filtering

async function updateLots() {
  try {
    const groupIds = [62007, 60309, 63759, 69639, 73072, 73121];
    const apiUrl = '/api/proxy/online-auctions';
    const allAuctions = [];

    // Fetch data for each GroupId
    for (const groupId of groupIds) {
      const params = new URLSearchParams({
        OnlineAuctionGroupId: groupId,
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

      allAuctions.push(...auctions);
    }

    // expose all lots to your filter logic
    globalAuctions = allAuctions.slice();

    // Group by GroupId
    const auctionsByGroupId = allAuctions.reduce((groups, auction) => {
      const groupId = auction.GroupId;
      if (groupIds.includes(groupId)) {
        groups[groupId] = groups[groupId] || [];
        groups[groupId].push(auction);
      }
      return groups;
    }, {});

    const auctionsContainer = document.querySelector('#auctions-container');
    auctionsContainer.innerHTML = '';

    Object.entries(auctionsByGroupId).forEach(([groupId, auctions]) => {
      const offeredAuctions = auctions.filter(
        a => a.SoldStatus !== 'Withdrawn' && a.SoldStatus !== 'Postponed'
      );
      const soldAuctions = auctions.filter(a => a.SoldStatus === 'Sold');

      const totalOffered = offeredAuctions.length;
      const totalSold = soldAuctions.length;
      const successRate = totalOffered > 0 ? (totalSold / totalOffered) * 100 : 0;

      const totalRaised = soldAuctions.reduce(
        (acc, a) => acc + (a.SalePrice || 0),
        0
      );

      const formattedRaised = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(totalRaised);

      // Map GroupId → auction date (you can tweak these labels)
      const formattedEndDate =
        groupId === '60309'
          ? '16 Jul 2024'
          : groupId === '62007'
          ? '8 Oct 2024'
          : groupId === '63759'
          ? '12 Nov 2024'
          : groupId === '69639'
          ? '13 May 2025'
          : groupId === '73072'
          ? '5 Aug 2025'
          : groupId === '73121'
          ? '30 Sep 2025'
          : 'Unknown Date';

      const collapseId = `prev-lots-${groupId}`; // unique per auction group

      // ===== inner lots (same idea as your old accordion) =====
      const lotsHtml = auctions.map(auction => {
  const statusLabel = auction.SoldStatus || 'Lot';
  const statusClass =
    statusLabel === 'Sold'
      ? 'status-sold'
      : statusLabel === 'Withdrawn'
      ? 'status-withdrawn'
      : 'status-other';

  const thumbnail = auction.Thumbnail || 'static/images/lotsimg.png';
  const description = (auction.Tagline || 'No description available.')
    .replace('TEST PROPERTY, ', '');

  const endDate = auction.EndDate
    ? new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(auction.EndDate))
    : 'N/A';

  const shouldHidePrice =
    auction.LotNumber === 14 ||
    auction.LotNumber === 15 ||
    auction.SoldStatusStage === 2 ||
    auction.SoldStatus === 'No Bids' ||
    auction.SoldStatus === 'Unsold';

  const formattedPrice = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(auction.SalePrice || 0);

  const priceHtml = !shouldHidePrice
    ? `<p class="prev-lot-price"><strong>Sold For:</strong> <span>${formattedPrice}</span></p>`
    : '';

  const detailsUrl = auction.LotDetailsUrl || '#';

  return `
    <div class="col">
      <div class="prev-lot-card">
        <div class="prev-lot-image-wrapper">
          <span class="prev-lot-status-badge ${statusClass}">
            ${statusLabel}
          </span>
          <img src="${thumbnail}" alt="Lot image" class="prev-lot-image" />
        </div>

        <div class="prev-lot-body">
          <p class="prev-lot-description">${description}</p>

          <p class="prev-lot-end">
            <strong>End Date:</strong>
            <span>${endDate}</span>
          </p>

          ${priceHtml}

          <a href="${detailsUrl}"
             target="_blank"
             rel="noopener"
             class="prev-lot-details-btn">
            View Details
          </a>
        </div>
      </div>
    </div>
  `;
}).join('');

      // ===== outer card (Market Highlights layout + collapse) =====
      const cardHtml = `
        <div class="col d-flex">
          <article class="prev-auction-card flex-fill">
            <div class="prev-auction-card-top">
              <img
                src="static/images/propnew.jpg"
                alt="The Swift Property Auctions Team"
                class="prev-auction-logo"
              />
              <span class="prev-auction-pill">Market Highlights</span>
            </div>

            <div class="prev-auction-body">
              <div class="prev-auction-row">
                <span class="prev-auction-icon">
                  <img src="static/images/icon-calendar.svg" alt="">
                </span>
                <span class="prev-auction-label">Auction:</span>
                <span class="prev-auction-value prev-auction-value-red">
                  ${formattedEndDate}
                </span>
              </div>

              <div class="prev-auction-row">
                <span class="prev-auction-icon">
                  <img src="static/images/icon-trend.svg" alt="">
                </span>
                <span class="prev-auction-label">Sale Rate:</span>
                <span class="prev-auction-value prev-auction-value-red">
                  ${Math.round(successRate)}%
                </span>
              </div>

              <div class="prev-auction-row">
                <span class="prev-auction-icon">
                  <img src="static/images/icon-pound.svg" alt="">
                </span>
                <span class="prev-auction-label">Total Raised:</span>
                <span class="prev-auction-value prev-auction-value-red">
                  ${formattedRaised}
                </span>
              </div>
            </div>

            <div class="prev-auction-actions">
            <!-- VIEW LOTS toggles collapse -->
            <button
                type="button"
                class="prev-auction-btn prev-auction-btn-primary"
                data-bs-toggle="collapse"
                data-bs-target="#${collapseId}"
                aria-expanded="false"
                aria-controls="${collapseId}"
            >
                View Lots
            </button>

            <!-- WANT TO SELL? goes to valuation page -->
            <a href="/valuation"
                class="prev-auction-btn prev-auction-btn-secondary">
                Want to Sell?
            </a>
            </div>


            <!-- HIDDEN LOTS GRID -->
            <div id="${collapseId}" class="collapse prev-auction-lots mt-3">
              <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                ${lotsHtml}
              </div>
            </div>
          </article>
        </div>
      `;

      auctionsContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
  } catch (error) {
    console.error('Error fetching lots:', error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await updateLots();
    attachFilterEvent(); // if you’re using the filters
  } catch (error) {
    console.error('Initialization failed:', error);
  }
});
