
function navigateToFinancePage() {
    window.location.href = '/auction_finance';
}

function navigateToValuationPage() {
    window.location.href = '/valuation';
}

function navigateToLot(lotId) {
    // Logic to navigate to the lot's details page.
    // For example, you might change the window location:
    window.location.href = `/lot_details/${lotId}`;
    // Please adjust the above URL to match your application's routing structure.
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


// Async function to update lots by fetching them from the API
async function updateLots() {
    try {
        // Set up the query parameters
        const params = new URLSearchParams({
            LastModifiedSince: '2023-08-01',
            IsShownOnWeb: true,
            Limit: 10,
            Offset: 0,
            // Add more query parameters as needed
        });

        // Call your API endpoint including the query parameters
        const apiUrl = '/api/proxy/lots'; // Proxy endpoint on your Flask server;
        const response = await fetch(`${apiUrl}?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        // Retrieve the array directly from the response
        const responseBody = await response.json();

        // Make sure the responseBody is an array
        if (!Array.isArray(responseBody)) {
          throw new Error("Response does not contain a 'lots' array");
        }

        allLots = responseBody; // Store the fetched lots for later use

         // Find the index of the current lot in the array
         const currentIndex = allLots.findIndex(lot => lot.Id === currentLotId);
         const previousLotId = currentIndex > 0 ? allLots[currentIndex - 1].Id : null;
         const nextLotId = currentIndex < allLots.length - 1 ? allLots[currentIndex + 1].Id : null;
 
         const lotsContainer = document.querySelector('#lots-container');
         lotsContainer.innerHTML = '';

        // If the array is empty, you might want to show a message
        if (allLots.length === 0) {
            lotsContainer.innerHTML = '<p>No lots available.</p>';
            return;
        }

         // Generate HTML for Previous and Next buttons based on available data
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
        // Update the UI to notify the user of the error
        const lotsContainer = document.querySelector('#lots-container');
        lotsContainer.innerHTML = '<p>Error fetching lots. Please try again later.</p>';
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
    // Remove any reference to the API key here, as it will be securely added on the server side
    var cleanedAddress = fullAddress.replace("TEST PROPERTY, ", "");
    var encodedAddress = encodeURIComponent(cleanedAddress);

    // Make the AJAX call to your new server-side route
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

              // Insert the iframe into your page
              const mapContainer = document.getElementById('mapContainer'); // Make sure you have a container with this ID
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
    // Check for LotImages and generate carousel HTML if images are available
    let carouselHtml = '';
    let thumbnailsHtml = ''; // Added thumbnails container
    if (lot.LotImages && lot.LotImages.length) {
        carouselHtml = `
            <div>
                <div id="lotImageCarousel" class="carousel-inner carousel slide" data-ride="carousel">
                    ${lot.LotImages.map((image, index) =>
                        `<div class="carousel-item ${index === 0 ? 'active' : ''}">
                            <div class="carousel-item-container">
                                <img src="${image.Url}" class="d-block img-fluid" alt="Image ${index + 1}">
                            </div>
                        </div>`
                    ).join('')}
                
                <a class="carousel-control-prev" href="#lotImageCarousel" role="button" data-bs-slide="prev" data-bs-interval="false">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="sr-only"></span>
                </a>
                <a class="carousel-control-next" href="#lotImageCarousel" role="button" data-bs-slide="next" data-bs-interval="false">
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="sr-only"></span>
                </a>
                </div>
                <!-- Map container, initially hidden -->
                <div id="mapContainer" class="carousel-item" style="display: none;">
                ${createMapIframe(lot.FullAddress)}
                </div>
            </div>
        `;

        // Generate thumbnails HTML
        thumbnailsHtml = `
        <div class="carousel-thumbnails d-none d-lg-flex">
            ${lot.LotImages.map((image, index) =>
            `<img src="${image.Url}" class="carousel-thumbnail-img img-thumbnail tra-red-hover" alt="Thumbnail ${index + 1}" onclick="$('#lotImageCarousel').carousel(${index});">`
            ).join('')}
        </div>
        `;
    }

    let accommodationText = '';
    let locationText = '';
    let tenureText = '';
    let exteriorText = '';


    // Assuming 'lot' is the object that contains 'LotData'
    lot.LotData.forEach((data) => {
        if (data.Name === 'Accommodation' && data.ShowOnWeb) {
            accommodationText = data.Value;
        } else if (data.Name === 'Location' && data.ShowOnWeb) {
            locationText = data.Value;
        } else if (data.Name === 'Tenure' && data.ShowOnWeb) {
        tenureText = data.Value;
        } else if (data.Name === 'Exterior' && data.ShowOnWeb) {
        exteriorText = data.Value;
        }
    });
    
     // Build the HTML string for the lot details page
     const lotDetailsHtml = `
     <div class="lot-details">

        <div class="lot-details-top">
            <div class="top-right mr-10">
                <!-- Navigation Buttons -->
                <div id="lots-container" class="navigation-buttons">
                    ${PreviousLotId !== null ? `<a href="#" id="prev-lot" class="txt-700 text-white mr-15" onclick="navigateToLot(${PreviousLotId})">&lt; Previous Lot</a>` : ''}
                    ${NextLotId !== null ? `<a href="#" id="next-lot" class="txt-700 text-white" onclick="navigateToLot(${NextLotId})">Next Lot &gt;</a>` : ''}
                    <a href="#" id="all-lots" class="txt-700 text-white mr-15" onclick="navigateToAllLots()">All Lots &#x2191;</a>
                </div>
            </div>
            <div class="top-left ml-10">
                <h6 class="text-white">Lot: ${lot.LotNumber}</h6>
            </div>
        </div>

     <div class="header-row wide-60 bg-blue mb-3">
            <div class="lot-main-container">
            <div class="row justify-content-md-center">
                <!-- Lot Number and Address -->
                <div class="col-md-5 full-address txt-700 ml-10">
                    <h3 class="text-white">${lot.StreetNumber} ${lot.StreetName}, ${lot.StreetName2}</h3>
                    <h4 class="text-white">${lot.Town}, ${lot.County}, ${lot.PostCode}</h4>
                    <br>
                    <h6 class="h6-md text-white">${lot.Tagline}</h6>
                </div>
                <!-- Guide Price and Register Button -->
                <div class="col-md-5 guide-price txt-700 ml-10">
                    <h4 class="text-white">Guide Price</h4>
                    <h4 class="text-white"><span id="formattedPrice"></span></h4>
                    <a href="https://passport.eigroup.co.uk/account/log-in" target="_blank" class="btn btn-red tra-white-hover mb-2">Register to Bid</a>
                </div>
            </div>
        </div>
    </div>

    <div class="container">

         <div class="row mb-4">
                <div class="${lot.LotImages && lot.LotImages.length ? 'col-lg-8' : 'col-12'}">
                    ${lot.LotImages && lot.LotImages.length ? carouselHtml + thumbnailsHtml : `<img src="${lot.LotImages}" class="img-fluid" alt="Thumbnail">`}
                </div>

                <!-- Updated Button group with responsive layout -->
                <div class="button-group my-3 d-flex flex-column flex-lg-row">
                    <div class="px-1 mb-2 mb-lg-0">
                        <a href="https://passport.eigroup.co.uk/account/log-in" target="_blank" class="btn btn-blue tra-blue-hover btn-uniform">Download Legal Pack</a>
                    </div>
                    <div class="px-1 mb-2 mb-lg-0">
                        <button id="showMapButton" class="btn btn-blue tra-blue-hover btn-uniform">Show Map</button>
                    </div>
                    <div class="px-1 mb-2 mb-lg-0">
                        <a href="#contacts-2" class="btn btn-blue tra-blue-hover btn-uniform">Enquire Now</a>
                    </div>
                    <div class="px-1 mb-2 mb-lg-0">
                        <a href="https://www.youtube.com/@SwiftPropertyAuctions" target="_blank" class="btn btn-blue tra-blue-hover btn-uniform">Virtual Tour</a>
                    </div>
                    <div class="px-1 mb-2 mb-lg-0">
                        <a href="#" onclick="navigateToFinancePage(); return false;" class="btn btn-blue tra-blue-hover btn-uniform">Finance Available</a>
                    </div>
                </div>
             
                 <div class="description mb-3 py-3">
                     <h5 class="h5-sm txt-700 text-black">Property Description</h5>
                     <p class="p-lg text-black">${lot.Description}</p>
                 </div>


                <!-- Parent accordion div to wrap all accordion sections -->
                <div class="accordion">
                    <!-- Lot data section with collapsible content -->
                    <div class="lot-data mb-3 accordion-item2">

                        <!-- Accommodation Heading -->
                        <h5 class="h5-sm txt-700" id="headingAccommodation">
                            <button class="btn2 accordion-button text-black txt-700 d-flex" type="button" data-bs-toggle="collapse" data-bs-target="#collapseAccommodation" aria-expanded="true">
                            Accommodation
                            </button>
                        </h5>

                        <!-- Accommodation Content -->
                        <div id="collapseAccommodation" class="accordion-collapse collapse show" aria-labelledby="headingAccommodation" >
                        <div class="content">
                            <p class="p-lg text-black">${accommodationText}</p>
                            
                        </div>
                    </div>
                </div>

                <!-- Parent accordion div to wrap all accordion sections -->
                <div class="accordion">
                    <!-- Lot data section with collapsible content -->
                    <div class="lot-data mb-3 accordion-item2">

                        <!-- Location Heading -->
                        <h5 class="h5-sm txt-700 mt-2" id="headingLocation">
                            <button class="btn2 accordion-button text-black txt-700 d-flex" type="button" data-bs-toggle="collapse" data-bs-target="#collapseLocation" aria-expanded="true" >
                            Location
                            </button>
                        </h5>

                        <!-- Location Content -->
                        <div id="collapseLocation" class="accordion-collapse collapse show" aria-labelledby="headingLocation">
                            <div class="content">
                                <p class="p-lg text-black">${locationText}</p>
                                
                            </div>
                        </div
                     </div>
                </div>        

                <!-- Parent accordion div to wrap all accordion sections -->
                <div class="accordion">
                    <!-- Lot data section with collapsible content -->
                    <div class="lot-data mb-3 accordion-item2">

                        <!-- Tenure Heading -->
                        <h5 class="h5-sm txt-700 mt-2" id="headingTenure">
                            <button class="btn2 accordion-button text-black txt-700 d-flex" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTenure" aria-expanded="true">
                            Tenure
                            </button>
                        </h5>

                        <!-- Tenure Content -->
                        <div id="collapseTenure" class="accordion-collapse collapse show" aria-labelledby="headingTenure">
                            <div class="content">
                                <p class="p-lg text-black">${tenureText}</p>
                                
                            </div>
                        </div>
                    </div>
                </div>        

                <!-- Parent accordion div to wrap all accordion sections -->
                <div class="accordion">
                    <!-- Lot data section with collapsible content -->
                    <div class="lot-data mb-3 accordion-item2">


                        <!-- Exterior Heading -->
                        <h5 class="h5-sm txt-700 mt-2" id="headingExterior">
                        <button class="btn2 accordion-button text-black txt-700 d-flex" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExterior" aria-expanded="true" >
                        Exterior
                        </button>
                        </h5>

                        <!-- Exterior Content -->
                        <div id="collapseExterior" class="accordion-collapse collapse show" aria-labelledby="headingExterior">
                            <div class="content">
                                <p class="p-lg text-black">${exteriorText}</p>
                                
                            </div>
                        </div>
                    </div>  
                </div>
                
                <!-- Parent accordion div to wrap all accordion sections -->
                <div class="accordion">
                    <!-- Lot data section with collapsible content -->
                    <div class="lot-data mb-3 accordion-item2">

                        <!-- Viewing times section with collapsible content -->
                        <div class="viewing-times mb-3">
                            <h5 class="h5-sm txt-700" id="headingViewingInformation">
                            <button class="btn2 accordion-button text-black txt-700 d-flex" type="button" data-bs-toggle="collapse" data-bs-target="#collapseViewingInformation" aria-expanded="true">
                            Viewing Information
                            </button>
                            </h5>

                            <div id="collapseViewingInformation" class="accordion-collapse collapse show" aria-labelledby="headingViewingInformation">
  <div class="content">
    <p class="p-lg text-black">${lot.ViewingTimeDescription}</p>
    <ul class="viewing-time-list">
      ${lot.ViewingTimes.map(viewing => {
        const startDate = new Date(viewing.StartDate);
        const endDate = new Date(viewing.EndDate);

        const options = { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
        const startFormatted = startDate.toLocaleString('en-US', options);
        const endFormatted = endDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

        // Regex to add the day suffix like 'th', 'nd', 'st', 'rd'
        const dayOfMonth = startDate.getDate();
        let daySuffix;
        if (dayOfMonth > 3 && dayOfMonth < 21) daySuffix = 'th';
        else if (dayOfMonth % 10 === 1) daySuffix = 'st';
        else if (dayOfMonth % 10 === 2) daySuffix = 'nd';
        else if (dayOfMonth % 10 === 3) daySuffix = 'rd';
        else daySuffix = 'th';

        // Replace the numeric day with the day and its suffix
        const startWithSuffix = startFormatted.replace(dayOfMonth, `${dayOfMonth}${daySuffix}`);
 
        return `
        <li class="viewing-time-item">
          ${viewing.Note ? `<p class="p-lg text-black">${viewing.Note} from:` : ''}
          ${startWithSuffix} - ${endFormatted} </p>
        </li>
        `;
      }).join('')}
    </ul>
  </div>
</div>
                        </div>
                    </div>
                </div>

                 <div class="additional-fees">
                     <h6 class="h6-sm txt-700 text-black">Additional Fees and Disclaimer</h6>
                     <p class="p-sm text-black py-2">The administration charge is £1,200, inclusive of VAT upon the virtual gavel, unless otherwise specified in the addendum. For details regarding buyers premium and disbursements, please consult the legal pack and addendum to determine any additional costs that may be payable by the purchaser upon completion. While particulars, images, and video tours on the website and within the catalogue are believed to be accurate, their precision is not guaranteed. The auctioneers will always strive to inform prospective purchasers of any variations to the catalogue, should such changes come to their attention. Neither the auctioneers nor their clients can be held responsible for any losses, damages, or abortive costs incurred in respect of lots that are withdrawn or sold prior to auction. Information concerning rating matters has been acquired through verbal inquiry only. Prospective purchasers are advised to conduct their own inquiries with the appropriate authorities. Prospective purchasers are considered responsible for verifynexing whether tenanted properties are currently occupied and whether rents are being paid. All measurements, areas, and distances are approximate only. Potential buyers are urged to verify them. No representation or warranty is made in respect to the structure of any properties or in relation to their state of repair. Prospective buyers should arrange for a survey of the particular lot by a professionally qualified person.</p>
                 </div>
             
        </div>
    </div>
 `;

 // Set the inner HTML of the main content container with the lot details HTML
 const mainContentContainer = document.getElementById('main-content');
 mainContentContainer.innerHTML = lotDetailsHtml;
  // Assuming that 'lot' object and 'OnlineAuction' property are already defined with 'StartingPrice'
const formattedPrice = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(lot.OnlineAuction.StartingPrice);

// Example: Assuming you have the input tag for address in your form as defined earlier
const propertyAddressInput = document.querySelector("input[name='property_address']");
if (propertyAddressInput) {
    const fullAddress = `${lot.StreetNumber}, ${lot.StreetName}, ${lot.StreetName2}, ${lot.Town}, ${lot.County}, ${lot.PostCode}`;
    propertyAddressInput.value = fullAddress; // Automatically populate the address
}

// Set the formatted price into the span element
document.getElementById('formattedPrice').textContent = formattedPrice;
}


function navigateToLot(lotId) {
    window.location.href = `/lot_details/${lotId}`;
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

window.addEventListener('popstate', function(event) {
    // Update the page content according to the new URL
    updatePageContentWithLotId(getCurrentLotId());
});

document.addEventListener('DOMContentLoaded', updateLots);

// Assuming this is run when the lot details route is encountered
renderLotPage();

// Call this function when the page loads
updateLots();