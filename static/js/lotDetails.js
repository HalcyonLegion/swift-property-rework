function navigateToValuationPage() {
    window.location.href = '/valuation';
}

// Go to a specific lot (simplest & most robust: full page load)
// function navigateToLot(lotId) {
//   window.location.href = `/lot_details/${lotId}`;
// }
function formatRichTextFromApi(value) {
  if (!value) return '';

  // Convert CRLF / LF / CR into <br> tags
  return value.replace(/\r\n|\r|\n/g, '<br>');
}

// Go back to the available lots page
function navigateToAllLots() {
  window.location.href = '/available_lots';
}


function navigateToCurrent() {
    // Logic to navigate to the lot's details page.
    // For example, you might change the window location:
    window.location.href = `/available_lots`;
    // Please adjust the above URL to match your application's routing structure.
}

// Single source of truth for routing ID
function getLotRouteId(lot) {
  return Number(lot.lotId);   // 👈 this is the one we care about
}

// Array to hold the fetched lot data
let allLots = [];
let currentLotId = getCurrentLotId(); // This should be a function that retrieves the current lot's ID

// This function needs to be adjusted to handle the path structure.
function getCurrentLotId() {
  const segments = window.location.pathname.split('/');
  const lotIdSegment = segments.pop() || segments.pop();
  return Number(lotIdSegment);
}

async function renderLotPage() {
  const lotId = getCurrentLotId();
  await updatePageContentWithLotId(lotId);
}

document.addEventListener('DOMContentLoaded', async () => {
  // get list of lots first so prev/next can be computed
  await updateLots();
  await renderLotPage();
});


async function updatePageContentWithLotId(lotId) {
  const numericLotId = Number(lotId);

  try {
    const data = await fetchLotData(numericLotId);

    if (!data || !data.lot) {
      document.getElementById('main-content').innerHTML =
        '<p>Lot not found or an error occurred.</p>';
      return;
    }

    const { lot, PreviousLotId, NextLotId } = data;

    renderLotDetails(lot, PreviousLotId, NextLotId);

    // optional but nice: scroll back to top of card
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error('Failed to update lot content:', err);
    document.getElementById('main-content').innerHTML =
      '<p>Lot not found or an error occurred.</p>';
  }
}

async function updateLots() {
  try {
    // Set up the query parameters
    const params = new URLSearchParams({
      LastModifiedSince: '2023-08-01',
      IsShownOnWeb: true,
      Limit: 10,
      Offset: 0,
    });

    const apiUrl = '/api/proxy/lots';
    const response = await fetch(`${apiUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const responseBody = await response.json();

    if (!Array.isArray(responseBody)) {
      throw new Error("Response does not contain a 'lots' array");
    }

    allLots = responseBody;

    // 🔴 NEW: bail out gracefully if the nav container isn’t there yet
    const lotsContainer = document.querySelector('#lots-container');
    if (!lotsContainer) {
      console.warn('updateLots: #lots-container not found, skipping nav render');
      return;
    }

    lotsContainer.innerHTML = '';

    const currentLotId = getCurrentLotId();
    const currentIndex = allLots.findIndex(
    lot => getLotRouteId(lot) === currentLotId
  );

  const previousLotId =
    currentIndex > 0 ? getLotRouteId(allLots[currentIndex - 1]) : null;

  const nextLotId =
    currentIndex !== -1 && currentIndex < allLots.length - 1
      ? getLotRouteId(allLots[currentIndex + 1])
      : null;

    const navigationHtml = `
      <div class="navigation-buttons col-md-12 d-flex mb-20">
        ${previousLotId !== null ? `<a href="#" class="txt-700 text-white mr-15" onclick="navigateToLot(${previousLotId}); return false;">&lt; Previous Lot</a>` : ''}
        <a href="#" onclick="navigateToCurrent(); return false;" class="txt-700 text-white mr-15">All Lots &#x2191;</a>
        ${nextLotId !== null ? `<a href="#" class="txt-700 text-white" onclick="navigateToLot(${nextLotId}); return false;">Next Lot &gt;</a>` : ''}
      </div>
    `;

    lotsContainer.innerHTML = navigationHtml;

  } catch (error) {
    console.error('Error fetching lots:', error);
    const lotsContainer = document.querySelector('#lots-container');
    if (lotsContainer) {
      lotsContainer.innerHTML = '<p>Error fetching lots. Please try again later.</p>';
    }
  }
}


async function fetchLotData(lotId) {
  // normalise to number for comparisons
  const numericLotId = Number(lotId);

  try {
    const response = await fetch(`/api/lot_details/${numericLotId}`);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(`Network response was not ok, status ${response.status}`);
    }

    const { lot } = json;

    // Default to no neighbours
    let PreviousLotId = null;
    let NextLotId = null;

    // Only try to work them out if we already have the lot list
    if (Array.isArray(allLots) && allLots.length > 0) {
      const currentIndex = allLots.findIndex(
      item => getLotRouteId(item) === numericLotId
    );

    if (currentIndex !== -1) {
      PreviousLotId =
        currentIndex > 0 ? getLotRouteId(allLots[currentIndex - 1]) : null;

      NextLotId =
        currentIndex < allLots.length - 1
          ? getLotRouteId(allLots[currentIndex + 1])
          : null;
    }

    }

    return { lot, PreviousLotId, NextLotId };
  } catch (error) {
    console.error('Error fetching lot data:', error);
  }
}


function navigateToLot(lotId) {
  // Update the browser's history stack
  history.pushState(null, '', `/lot_details/${lotId}`);

  // Update the page content for the new lot
  updatePageContentWithLotId(lotId);
  
  // Refresh navigation
  updateLots();
}


function createMapIframe(fullAddress) {
    // Remove any reference to the API key
    var cleanedAddress = fullAddress.replace("TEST PROPERTY, ", "");
    var encodedAddress = encodeURIComponent(cleanedAddress);

    // Make the AJAX call to the new server-side route
    fetch(`/generate_map?address=${encodedAddress}`)
      .then(response => response.json())
      .then(data => {
          if (data.embed_url) {
              // create iframe using the URL received from the server
              const iframe = document.createElement('iframe');
              iframe.width = "856";
              iframe.height = "481";
              iframe.frameBorder = "0";
              iframe.style.border = "0";
              iframe.src = data.embed_url;
              iframe.allowFullscreen = true;

              // Inserts the iframe into the page
              const mapContainer = document.getElementById('mapContainer'); // have a container with this ID
              mapContainer.innerHTML = '';
              mapContainer.appendChild(iframe);
          }
      })
      .catch(error => {
          console.error('Error generating map iframe:', error);
      });
}

// function scrollThumbnails(direction) {
//     let container = $('.carousel-thumbnails');
//     let scrollAmount = 0;

//     if (direction === 'next') {
//         scrollAmount = container.scrollLeft() + 200; // Adjust scroll amount
//     } else {
//         scrollAmount = container.scrollLeft() - 200; // Adjust scroll amount
//     }

//     container.animate({
//         scrollLeft: scrollAmount
//     }, 200); // Adjust speed if necessary
// }

function renderLotDetails(lot, PreviousLotId, NextLotId) {

  // figure out if we *have* neighbours
  const hasPrev = PreviousLotId != null;
  const hasNext = NextLotId != null;

  // ----- IMAGE / MEDIA SETUP -----
  let carouselHtml = "";
  if (lot.LotImages && lot.LotImages.length) {
    carouselHtml = `
      <div class="lot-media">
        <div id="lotImageCarousel" class="carousel slide" data-ride="carousel">
          <div class="carousel-inner">
            ${lot.LotImages.map((image, index) => `
              <div class="carousel-item ${index === 0 ? "active" : ""}">
                <div class="carousel-item-container">
                  <img src="${image.Url}" class="d-block img-fluid" alt="Image ${index + 1}">
                </div>
              </div>
            `).join("")}
          </div>

          <a class="carousel-control-prev" href="#lotImageCarousel" role="button" data-bs-slide="prev" data-interval="false">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="sr-only"></span>
          </a>
          <a class="carousel-control-next" href="#lotImageCarousel" role="button" data-bs-slide="next" data-interval="false">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="sr-only"></span>
          </a>
        </div>

        <!-- Map container, initially hidden -->
        <div id="mapContainer" style="display: none;">
          ${createMapIframe(lot.FullAddress)}
        </div>
      </div>
    `;
  }

  // Right-hand stacked images (first 2 thumbnails)
  let sideImagesHtml = "";
  if (lot.LotImages && lot.LotImages.length > 1) {
    const sideImages = lot.LotImages.slice(1, 3);
    sideImagesHtml = `
      <div class="lot-side-images d-none d-lg-flex flex-column">
        ${sideImages.map((image, index) => `
          <div class="lot-side-image-wrapper">
            <img src="${image.Url}"
                 class="lot-side-image"
                 alt="Thumbnail ${index + 2}"
                 onclick="$('#lotImageCarousel').carousel(${index + 1});">
          </div>
        `).join("")}
      </div>
    `;
  }

  // ----- LOT DATA (ACCOM / LOCATION / etc.) -----
  let accommodationText = "";
  let locationText = "";
  let tenureText = "";
  let exteriorText = "";

  (lot.LotData || []).forEach(data => {
  if (data.Name === "Accommodation" && data.ShowOnWeb) {
    // keep <b> tags and turn newlines into <br>
    accommodationText = formatRichTextFromApi(data.Value);
  } else if (data.Name === "Location" && data.ShowOnWeb) {
    locationText = data.Value;
  } else if (data.Name === "Tenure" && data.ShowOnWeb) {
    tenureText = data.Value;
  } else if (data.Name === "Exterior" && data.ShowOnWeb) {
    exteriorText = data.Value;
  }
});


  // Viewing times list – guard for missing array
  const viewingTimesHtml =
    Array.isArray(lot.ViewingTimes) && lot.ViewingTimes.length
      ? lot.ViewingTimes
          .map(viewing => {
            const startDate = new Date(viewing.StartDate);
            const endDate = new Date(viewing.EndDate);

            const options = {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true
            };

            const startFormatted = startDate.toLocaleString("en-GB", options);
            const endFormatted = endDate.toLocaleString("en-GB", {
              hour: "numeric",
              minute: "numeric",
              hour12: true
            });

            const dayOfMonth = startDate.getDate();
            let daySuffix;
            if (dayOfMonth > 3 && dayOfMonth < 21) daySuffix = "th";
            else if (dayOfMonth % 10 === 1) daySuffix = "st";
            else if (dayOfMonth % 10 === 2) daySuffix = "nd";
            else if (dayOfMonth % 10 === 3) daySuffix = "rd";
            else daySuffix = "th";

            const startWithSuffix = startFormatted.replace(
              dayOfMonth,
              `${dayOfMonth}${daySuffix}`
            );

            return `
              <li class="viewing-time-item">
                ${viewing.Note ? `<p class="p-lg text-black">${viewing.Note} from:</p>` : ""}
                <p class="p-lg text-black">${startWithSuffix} - ${endFormatted}</p>
              </li>
            `;
          })
          .join("")
      : "";

  // Address line + tagline
  const fullAddress = [
    lot.StreetNumber,
    lot.StreetName,
    lot.Town,
    lot.County,
    lot.PostCode
  ]
    .filter(Boolean)
    .join(", ");

  // Auction finance URL (injected from template – see note below)
  const auctionFinanceUrl = 'https://www.swiftbridgingfinance.co.uk'

  // ----- MAIN TEMPLATE -----
  const lotDetailsHtml = `
  <div class="lot-details-wrapper">
    <div class="lot-main-card">

      <!-- ROW 1: LOT + GUIDE -->
      <div class="lot-main-header">
        <div class="lot-chip-group">
          <span class="lot-chip lot-chip-lot">LOT ${lot.LotNumber}</span>
          <span class="lot-chip lot-chip-guide">
            Guide Price:&nbsp;<span data-formatted-price></span>
          </span>
        </div>
      </div>

      <!-- ROW 2: TITLE + TAGLINE (LEFT)  /  NAV BUTTONS (RIGHT) -->
      <div class="lot-title-row">
        <div class="lot-title-block">
          <h1 class="lot-title">${fullAddress}</h1>
          ${lot.Tagline ? `<p class="lot-subtitle">${lot.Tagline}</p>` : ""}
        </div>

        <div class="lot-nav-row">
          <!-- Prev arrow -->
          <button
            class="lot-nav-arrow arrow-previous ${hasPrev ? '' : 'is-disabled'}"
            ${hasPrev ? `onclick="navigateToLot(${PreviousLotId})"` : ''}
            aria-label="Previous lot"
          >
            <img src="/static/images/supeLArrow.svg" alt="Previous">
          </button>

          <!-- Prev text -->
          <button
            class="lot-nav-pill previous-svg ${hasPrev ? '' : 'is-disabled'}"
            ${hasPrev ? `onclick="navigateToLot(${PreviousLotId})"` : ''}
          >
            Previous
          </button>

          <!-- All lots -->
          <button class="lot-nav-pill all-lots-btn" onclick="navigateToAllLots()">
            All Lots
          </button>

          <!-- Next text -->
          <button
            class="lot-nav-pill next-svg ${hasNext ? '' : 'is-disabled'}"
            ${hasNext ? `onclick="navigateToLot(${NextLotId})"` : ''}
          >
            Next
          </button>

          <!-- Next arrow -->
          <button
            class="lot-nav-arrow arrow-next ${hasNext ? '' : 'is-disabled'}"
            ${hasNext ? `onclick="navigateToLot(${NextLotId})"` : ''}
            aria-label="Next lot"
          >
            <img src="/static/images/supeRArrow.svg" alt="Next">
          </button>
        </div>
      </div>

        <!-- MAIN MEDIA ONLY (top level = photos) -->
        <div class="lot-media-wrapper">
          <div class="lot-main-media-row">
            ${carouselHtml}
            ${sideImagesHtml}
          </div>

          <!-- CTA ROW UNDER IMAGES -->
          <div class="lot-cta-row">
            <a href="https://passport.eigroup.co.uk/account/log-in"
               target="_blank"
               class="lot-cta-btn">
              Legal Pack
            </a>
            <a href="https://passport.eigroup.co.uk/account/log-in"
               target="_blank"
               class="lot-cta-btn">
              Register to Bid
            </a>
            <a href="${auctionFinanceUrl}"
                class="lot-cta-btn"
                target="_blank"
                rel="noopener noreferrer">
                Auction Finance
                </a>

            <a href="https://www.youtube.com/@SwiftPropertyAuctions"
               target="_blank"
               class="lot-cta-btn">
              Virtual Tour
            </a>
            <a href="#newsletter-2" class="lot-cta-btn">
              Enquire Now
            </a>
          </div>
        </div>

        <!-- LOWER: DESCRIPTION + HELP + FINANCE (two-column layout) -->
        <div class="lot-bottom-layout">
          <!-- LEFT: description etc -->
          <div class="lot-info-card">
            <div class="lot-info-section">
              <h5 class="lot-info-heading">Property Description</h5>
              <p class="lot-info-body">${lot.Description || ""}</p>
            </div>

            <div class="lot-info-section">
              <h5 class="lot-info-heading">Accommodation</h5>
              <p class="lot-info-body">${accommodationText || ""}</p>
            </div>

            <div class="lot-info-section">
              <h5 class="lot-info-heading">Location</h5>
              <p class="lot-info-body">${locationText || ""}</p>
            </div>

            <div class="lot-info-section">
              <h5 class="lot-info-heading">Tenure</h5>
              <p class="lot-info-body">${tenureText || ""}</p>
            </div>

            <div class="lot-info-section">
              <h5 class="lot-info-heading">Exterior</h5>
              <p class="lot-info-body">${exteriorText || ""}</p>
            </div>

            <div class="lot-info-section">
              <h5 class="lot-info-heading">Viewing Information</h5>
              <p class="lot-info-body">${lot.ViewingTimeDescription || ""}</p>
              ${
                viewingTimesHtml
                  ? `<ul class="viewing-time-list">${viewingTimesHtml}</ul>`
                  : ""
              }
            </div>

            <div class="lot-info-section">
              <h5 class="lot-info-heading">Important Information for Prospective Purchasers</h5>
              <p class="lot-info-body lot-info-body-small">
                A buyer’s administration charge of £1,800 including VAT applies to all lots unless otherwise stated in the addendum. Please refer to the legal pack and addendum for any additional buyer’s premium or disbursements payable on completion.

                Guide prices represent the seller’s minimum expectation and may change at any time prior to the auction. They are not guaranteed selling prices. Each lot is offered subject to a reserve price, which we expect to be within the guide range or up to 10% above a single-figure guide. Accuracy of Information. All particulars, images, videos, and descriptions are provided in good faith; however, their accuracy cannot be guaranteed. We will make every reasonable effort to inform purchasers of any changes or updates to the catalogue.

                Measurements, areas, and distances are approximate. Prospective purchasers should rely on their own enquiries. For tenanted lots, buyers should independently verify occupancy status and rent payments. Rating information is obtained by verbal enquiry only and should be checked with the relevant authority. Swift Property Auctions and the seller accept no responsibility for any losses, costs, or abortive expenses relating to lots withdrawn or sold before the auction. Viewings are arranged via third-party agents; while we aim to give notice of any changes, we cannot accept liability for cancellations or no-shows. Access to a property after exchange is not guaranteed.

                No representation or warranty is given regarding the structure, condition, or state of repair of any property. Prospective purchasers are strongly advised to obtain an independent survey and verify all information before bidding. These particulars do not form part of any offer or contract, and neither Swift Property Auctions nor its employees or agents hold authority to make binding assurances about any property.
              </p>
            </div>
          </div>

                      <!-- RIGHT: help card above finance banner -->
            <div class="lot-right-column">
              <aside class="lot-help-card">
                <div class="lot-help-header">
                  <div class="lot-help-text">
                    <p class="lot-help-title">Need help before you bid?</p>
                    <p class="lot-help-body">
                      If you’re preparing to bid and need anything explained, just let us know — we’re here to help.
                    </p>
                  </div>

                  <!-- SWIFT INTELLIGENCE badge -->
                  <div class="lot-help-badge">
                    <!-- SWIFT INTELLIGENCE badge -->
                    <div class="lot-help-badge">
                      <img
                        src="/static/images/swift-intelligence-badge.svg"
                        alt="Swift Intelligence – Industry Leading"
                        class="lot-help-badge-img"
                      >
                    </div>
                  </div>
                </div>

                <!-- Buttons with icons -->
                <div class="lot-help-buttons">
                  <a href="tel:02089504588" class="lot-help-btn primary">
                    <img src="/static/images/proPhone.svg" alt="" class="lot-help-icon">
                    <span>Call Swift</span>
                  </a>

                  <a href="#contacts-2" class="lot-help-btn">
                    <img src="/static/images/proQuestion.svg" alt="" class="lot-help-icon">
                    <span>Ask a Question</span>
                  </a>

                  <a href="https://wa.me/442089504588" target="_blank" class="lot-help-btn">
                    <img src="/static/images/proWhat.svg" alt="" class="lot-help-icon">
                    <span>WhatsApp</span>
                  </a>
                </div>
              </aside>


                        <!-- Right-hand auction finance banner -->
                        <aside class="lot-finance-banner">
                        <div class="finance-card">
                            <!-- blurred background image + circular image are handled by CSS -->
                            <div class="finance-card-content">
                            <div class="finance-header">
                                <div class="finance-logo">
                                    <img src="${sbfLogoUrl}" alt="SBF logo" class="finance-logo-img">
                                </div>
                                <h5 class="finance-title">AUCTION FINANCE</h5>
                            </div>

                            <p class="finance-subtitle">
                                Fast, flexible auction finance — done the right way.
                            </p>

                            <ul class="finance-list">
                                <li>Up to 75% LTV</li>
                                <li>Quick decisions</li>
                                <li>Finance ready before the auction</li>
                            </ul>

                            <a href="${auctionFinanceUrl}" class="finance-btn" target="_blank">
                                Get Pre-Approved in Minutes
                            </a>

                            <p class="finance-footnote">
                                Swift Bridging Finance acts as a referral agent. Lending is provided by
                                third-party finance partners.
                            </p>
                            </div>
                        </div>
                        </aside>

          </div>
        </div>
      </div>
    </div>
  `;

    // inject into DOM (same as you already do)
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
        mainContent.innerHTML = lotDetailsHtml;
    }

    // format price once DOM is there
    const priceSpans = document.querySelectorAll("[data-formatted-price]");
    priceSpans.forEach(span => {
        if (typeof lot.NumericGuidePrice === "number") {
        span.textContent =
            "£" + lot.NumericGuidePrice.toLocaleString("en-GB") + "+";
        } else {
        span.textContent = lot.GuidePrice || "";
        }
    });

    // Populate hidden enquiry field with address
    const propertyAddressInput = document.querySelector("input[name='property_address']");
    if (propertyAddressInput) {
        propertyAddressInput.value = fullAddress;
    }
}

function renderLotPage() {
    // Extract the lot ID from the URL
    const pathParts = window.location.pathname.split('/');
    const lotId = pathParts[pathParts.length - 1];

    // Fetch the lot data
    fetchLotData(lotId).then(data => {
        // console.log('Lot data received:', data); // Add this log to check if the data is as expected.
        if (data && data.lot) {
            renderLotDetails(data.lot, data.PreviousLotId, data.NextLotId);
        } else {
            // Render an error or 'not found' message
            // console.log('Rendering error message due to missing data.'); // Add this log to check if this part is reached.
            document.getElementById('main-content').innerHTML = '<p>Lot not found or an error occurred.</p>';
        }
    }).catch(error => {
        // Log the error if the promise was rejected
        console.error('Failed to render lot page:', error);
        document.getElementById('main-content').innerHTML = '<p>Lot not found or an error occurred.</p>';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('click', function(event) {
        if (event.target.id === 'showMapButton') {
            const mapContainer = document.getElementById('mapContainer');
            const imagesContainer = document.getElementById('lotImageCarousel');
            if (!mapContainer || !imagesContainer) {
                // One or both elements don't exist, so exit the function.
                // console.log("Required containers not found.");
                return;
            }
            if (window.getComputedStyle(mapContainer).display === 'none') {
                mapContainer.style.display = 'block';
                imagesContainer.style.display = 'none';
            } else {
                mapContainer.style.display = 'none';
                imagesContainer.style.display = 'block';
            }
        }
    });
});

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Render the lot content for the current /lot_details/:id
  await renderLotPage();

  // 2. Once the lot details HTML exists (including #lots-container), build prev/next nav
  updateLots();
});
