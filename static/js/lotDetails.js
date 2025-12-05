
function navigateToFinancePage() {
    window.location.href = '/auction_finance';
}

function navigateToValuationPage() {
    window.location.href = '/valuation';
}

function navigateToLot(lotId) {
  window.location.href = `/lot_details/${lotId}`;
}


function navigateToCurrent() {
    // Logic to navigate to the lot's details page.
    // For example, you might change the window location:
    window.location.href = `/current_lots`;
    // Please adjust the above URL to match your application's routing structure.
}

// Array to hold the fetched lot data
let allLots = [];
let currentLotId = getCurrentLotId(); // This should be a function that retrieves the current lot's ID

// This function needs to be adjusted to handle the path structure.
function getCurrentLotId() {
    // Assumes the URL is like: http://127.0.0.1:5000/lot_details/{lotId}
    const pathname = window.location.pathname;
    const segments = pathname.split('/');
    const lotIdSegment = segments.pop() || segments.pop();  // Handle potential trailing slash
    return parseInt(lotIdSegment, 10);
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
    const currentIndex = allLots.findIndex(lot => String(lot.Id) === String(currentLotId));
    const previousLotId = currentIndex > 0 ? allLots[currentIndex - 1].Id : null;
    const nextLotId = currentIndex < allLots.length - 1 ? allLots[currentIndex + 1].Id : null;

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
    try {
        const response = await fetch(`/api/lot_details/${lotId}`);
        const json = await response.json(); // Capture JSON response before any conditional checks

        // Log the complete JSON response for debugging purposes
        // console.log('API response:', json);


        if (!response.ok) {
            throw new Error(`Network response was not ok, status ${response.status}`);
        }

        const { lot } = json;
        // Assuming the response includes lot data, previous lot ID, and next lot ID
        // Get index of current lot
        const currentIndex = allLots.findIndex(item => item.Id === lotId);
        // Calculate PreviousLotId and NextLotId
        const PreviousLotId = currentIndex > 0 ? allLots[currentIndex - 1].Id : null;
        const NextLotId = currentIndex < allLots.length - 1 ? allLots[currentIndex + 1].Id : null;
        return {lot, PreviousLotId, NextLotId};
    } catch (error) {
        console.error('Error fetching lot data:', error);
    }
}

function navigateToLot(lotId) {
    // Update the browser's history stack
    history.pushState(null, '', `/lot_details/${lotId}`);

    // Update the page content for the new lot
    updatePageContentWithLotId(lotId);
    
    // Refresh navigation - this might be optional if you build the navigation when the page content updates
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
                             class="img-fluid lot-side-image" 
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
            accommodationText = data.Value;
        } else if (data.Name === "Location" && data.ShowOnWeb) {
            locationText = data.Value;
        } else if (data.Name === "Tenure" && data.ShowOnWeb) {
            tenureText = data.Value;
        } else if (data.Name === "Exterior" && data.ShowOnWeb) {
            exteriorText = data.Value;
        }
    });

    // Viewing times list – guard for missing array
    const viewingTimesHtml = (Array.isArray(lot.ViewingTimes) && lot.ViewingTimes.length)
        ? lot.ViewingTimes.map(viewing => {
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

            const startWithSuffix = startFormatted.replace(dayOfMonth, `${dayOfMonth}${daySuffix}`);

            return `
                <li class="viewing-time-item">
                    ${viewing.Note ? `<p class="p-lg text-black">${viewing.Note} from:</p>` : ""}
                    <p class="p-lg text-black">${startWithSuffix} - ${endFormatted}</p>
                </li>
            `;
        }).join("")
        : "";

    // Address line + tagline
    const fullAddress = [
        lot.StreetNumber,
        lot.StreetName,
        lot.Town,
        lot.County,
        lot.PostCode
    ].filter(Boolean).join(", ");

    // ----- MAIN TEMPLATE -----
    const lotDetailsHtml = `
      <div class="lot-details-wrapper">
        <div class="lot-main-card">
          
          <!-- TOP: LOT + GUIDE + PREV / ALL / NEXT -->
          <div class="lot-main-header">
            <div class="lot-chip-group">
              <span class="lot-chip lot-chip-lot">LOT ${lot.LotNumber}</span>
              <span class="lot-chip lot-chip-guide">
                Guide Price: <span data-formatted-price></span>
              </span>
            </div>

            <div class="lot-nav-row">
              ${
                PreviousLotId !== null
                  ? `
                  <button class="lot-nav-arrow" onclick="navigateToLot(${PreviousLotId})" aria-label="Previous lot">&lt;</button>
                  <button class="lot-nav-pill" onclick="navigateToLot(${PreviousLotId})">Previous</button>
                `
                  : ""
              }
              <button class="lot-nav-pill" onclick="navigateToAllLots()">All Lots</button>
              ${
                NextLotId !== null
                  ? `
                  <button class="lot-nav-pill" onclick="navigateToLot(${NextLotId})">Next</button>
                  <button class="lot-nav-arrow" onclick="navigateToLot(${NextLotId})" aria-label="Next lot">&gt;</button>
                `
                  : ""
              }
            </div>
          </div>

          <!-- TITLE + TAGLINE -->
          <div class="lot-title-block">
            <h1 class="lot-title">${fullAddress}</h1>
            ${lot.Tagline ? `<p class="lot-subtitle">${lot.Tagline}</p>` : ""}
          </div>

          <!-- MAIN MEDIA + SIDE HELP PANEL -->
          <div class="lot-media-help-grid">
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
                <a href="#" onclick="navigateToFinancePage(); return false;" class="lot-cta-btn">
                  Auction Finance
                </a>
                <a href="https://www.youtube.com/@SwiftPropertyAuctions"
                   target="_blank"
                   class="lot-cta-btn">
                  Virtual Tour
                </a>
                <a href="#contacts-2"
                   class="lot-cta-btn">
                  Enquire Now
                </a>
              </div>
            </div>

            <!-- RIGHT: HELP CARD (simplified Figma version) -->
            <aside class="lot-help-column">
              <div class="lot-help-card">
                <p class="lot-help-title">Need help before you bid?</p>
                <p class="lot-help-body">
                  If you’re preparing to bid and need anything explained, just let us know — we’re here to help.
                </p>

                <div class="lot-help-badge">
                  <div class="lot-help-badge-text">
                    <span class="badge-swift">SWIFT</span>
                    <span class="badge-line"></span>
                    <span class="badge-subline">INTELLIGENCE</span>
                    <span class="badge-subline-strong">INDUSTRY LEADING</span>
                  </div>
                </div>

                <div class="lot-help-buttons">
                  <a href="tel:02089504588" class="lot-help-btn primary">Call Swift</a>
                  <a href="#contacts-2" class="lot-help-btn">Ask a Question</a>
                  <a href="https://wa.me/442089504588" target="_blank" class="lot-help-btn">WhatsApp</a>
                </div>
              </div>
            </aside>
          </div>

          <!-- LOWER: DESCRIPTION + FINANCE CARD -->
          <div class="lot-bottom-layout">
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
                ${viewingTimesHtml ? `<ul class="viewing-time-list">${viewingTimesHtml}</ul>` : ""}
              </div>

              <div class="lot-info-section">
                <h5 class="lot-info-heading">Additional Fees and Disclaimer</h5>
                <p class="lot-info-body lot-info-body-small">
                  The administration charge is £1,200, inclusive of VAT upon the virtual gavel, unless otherwise specified in the addendum.
                  For details regarding buyers premium and disbursements, please consult the legal pack and addendum to determine any additional
                  costs that may be payable by the purchaser upon completion. While particulars, images, and video tours on the website and
                  within the catalogue are believed to be accurate, their precision is not guaranteed. The auctioneers will always strive to
                  inform prospective purchasers of any variations to the catalogue, should such changes come to their attention. Neither the
                  auctioneers nor their clients can be held responsible for any losses, damages, or abortive costs incurred in respect of lots
                  that are withdrawn or sold prior to auction. Information concerning rating matters has been acquired through verbal inquiry only.
                  Prospective purchasers are advised to conduct their own inquiries with the appropriate authorities. Prospective purchasers are
                  considered responsible for verifying whether tenanted properties are currently occupied and whether rents are being paid.
                  All measurements, areas, and distances are approximate only. Potential buyers are urged to verify them. No representation or
                  warranty is made in respect to the structure of any properties or in relation to their state of repair. Prospective buyers
                  should arrange for a survey of the particular lot by a professionally qualified person.
                </p>
              </div>
            </div>

            <!-- Right-hand auction finance banner (simplified) -->
            <aside class="lot-finance-banner">
              <div class="finance-card">
                <div class="finance-card-content">
                  <h5 class="finance-title">Auction Finance</h5>
                  <p class="finance-subtitle">
                    Fast, flexible auction finance — done the right way.
                  </p>
                  <ul class="finance-list">
                    <li>Up to 75% LTV</li>
                    <li>Quick decisions</li>
                  </ul>
                  <a href="{{ url_for('auction_finance') }}" class="finance-btn">
                    Get Pre-Approved in Minutes
                  </a>
                  <p class="finance-footnote">
                    Swift Bridging Finance acts as a referral agent. Lending is provided by third-party finance partners.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    `;

    // Inject into page
    const mainContentContainer = document.getElementById("main-content");
    mainContentContainer.innerHTML = lotDetailsHtml;

    // ----- PRICE FORMATTING -----
    if (lot.OnlineAuction && typeof lot.OnlineAuction.StartingPrice === "number") {
        const formattedPrice = new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP"
        }).format(lot.OnlineAuction.StartingPrice);

        document.querySelectorAll("[data-formatted-price]").forEach(el => {
            el.textContent = formattedPrice;
        });
    }

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
