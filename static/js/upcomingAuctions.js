document.addEventListener('DOMContentLoaded', () => {
  updateLots().then(() => {
    attachCalendarEventListeners(); // Attach event listeners to newly added buttons
  });
});

async function updateLots() {
  try {
    const hardcodedDates = [
      new Date(2024, 10, 12, 12, 0),  // 12th November 12:00
      new Date(2025, 1, 27, 12, 0),   // 27th February 12:00
      new Date(2025, 4, 13, 12, 0),   // 13th May 12:00
      new Date(2025, 8, 30, 12, 0),  // 30th September 12:00
      new Date(2025, 10, 27, 12, 0),   // 27th November 12:00
      new Date(2026, 1, 17, 12, 0),   // 17th February 12:00
    ];

    const lotsContainer = document.querySelector('#lots-container');
    lotsContainer.innerHTML = '';  // Clear current content

    hardcodedDates.forEach((date) => {
      const dateHtml = date.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
      const timeHtml = formatTime(date);

      const lotHtml = `
        <div class="col-12 auction-item-container">
          <div class="auction-item d-flex wow fadeInUp justify-content-between align-items-center">
            <div class="auction-image">
              <img class="img-fluid bg-blue padding-blue-background" src="static/images/swift-property-auctions-high-resolution-logo-transparent.svg" alt="Auction Item" />
            </div>
            <div class="auction-info d-flex flex-column justify-content-between">
              <div class="auction-date-time">
                <br>
                <h5 class="auction-date red-color txt-700">${dateHtml}</h5>
                <p class="auction-time txt-700 text-black mb-0">${timeHtml}</p>
                <span class="txt-700 text-black">Remote Bidding</span>
              </div>
            </div>
            <div class="auction-buttons">
              <a href="${window.location.origin}/current_lots" target="_blank" class="btn3 btn-sm btn-tra-red red-hover">View Catalogue</a>
              <div class="d-flex">
                <a href="#add-calendar" class="btn3 btn-sm btn-blue tra-blue-hover btn-add-to-calendar">Add to Calendar</a>
                <a href="${window.location.origin}/bidder_registration" class="btn3 btn-sm btn-red tra-red-hover">Register to Bid</a>
              </div>
            </div>
          </div>
        </div>`;
      lotsContainer.insertAdjacentHTML('beforeend', lotHtml);
    });
  } catch (error) {
    console.error('Error setting up lots:', error);
  }
}

// Attach calendar
function attachCalendarEventListeners() {
  const addToCalendarButtons = document.querySelectorAll('.btn-add-to-calendar');

  addToCalendarButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const auctionItemContainer = e.target.closest('.auction-item-container');
      const dateText = auctionItemContainer.querySelector('.auction-date').textContent;
      const timeText = auctionItemContainer.querySelector('.auction-time').textContent.split(' ')[0]; // Splits and takes the first part to avoid weekday from timeHtml

      const dateTimeString = `${dateText} ${timeText}`;
      const auctionDateTime = new Date(dateTimeString); // Using JavaScript's Date parsing for simplification

      const startTime = formatDateToICS(auctionDateTime);
      auctionDateTime.setHours(auctionDateTime.getHours() + 1); // Assuming 1 hour duration
      const endTime = formatDateToICS(auctionDateTime);

      generateAndDownloadICS(startTime, endTime);
    });
  });
}

function formatDateToICS(dateTime) {
  const pad = (num) => (num < 10 ? '0' + num : num);
  return `${dateTime.getUTCFullYear()}${pad(dateTime.getUTCMonth() + 1)}${pad(dateTime.getUTCDate())}T${pad(dateTime.getUTCHours())}${pad(dateTime.getUTCMinutes())}00Z`;
}

function generateAndDownloadICS(startTime, endTime) {
  const uid = `uid-${Date.now()}@example.com`;
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${startTime}
DTSTART:${startTime}
DTEND:${endTime}
SUMMARY:Swift Property Auctions Event
DESCRIPTION:We invite you to join our Auction Event
LOCATION:
END:VEVENT
END:VCALENDAR`;

// Creating a blob and downloading it
 const blob = new Blob([icsContent], {type: 'text/calendar;charset=utf-8'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'AuctionEvent.ics'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }

function formatTime(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;

  return hours + ':' + minutes + ' ' + ampm;
}
