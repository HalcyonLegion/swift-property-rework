document.addEventListener('DOMContentLoaded', () => {
  updateLots().then(() => {
    attachCalendarEventListeners(); // Attach event listeners to newly added buttons
  });
});

// === CONFIG: UPCOMING AUCTIONS ===
const auctions = [
  {
    season: 'Spring Auction',
    date: new Date(2026, 1, 17, 12, 0), // 17 Feb 2026, 12:00
  },
  {
    season: 'Spring Auction',
    date: new Date(2026, 2, 31, 12, 0), // 31 Mar 2026, 12:00
  },
  {
    season: 'Spring Auction',
    date: new Date(2026, 4, 14, 12, 0), // 14 May 2026, 12:00
  },
  {
    season: 'Summer Auction',
    date: new Date(2026, 5, 25, 12, 0), // 25 Jun 2026, 12:00
  },
  {
    season: 'Summer Auction',
    date: new Date(2026, 7, 6, 12, 0), // 6 Aug 2026, 12:00
  },
  {
    season: 'Autumn Auction',
    date: new Date(2026, 8, 17, 12, 0), // 17 Sep 2026, 12:00
  },
  {
    season: 'Autumn Auction',
    date: new Date(2026, 9, 29, 12, 0), // 29 Oct 2026, 12:00
  },
  {
    season: 'Autumn Auction',
    date: new Date(2026, 11, 10, 12, 0), // 10 Dec 2026, 12:00
  },
];

// === RENDER CARDS ===
async function updateLots() {
  try {
    const lotsContainer = document.querySelector('#lots-container');
    lotsContainer.innerHTML = '';

    auctions.forEach((auction) => {
      const { season, date } = auction;

      const dateHtml = formatAuctionDate(date);
      const timeHtml = formatDisplayTime(date); // 12:00 Midday style
      const isoDateTime = date.toISOString();

      const lotHtml = `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="auction-card wow fadeInUp">
            
            <!-- Season pill -->
            <div class="auction-card-season-pill">
              ${season.toUpperCase()}
            </div>

            <!-- Swift badge top-right -->
            <div class="auction-card-badge">
              <img 
                src="static/images/swift-card-badge.svg" 
                alt="The Swift Property Auctions Team"
              >
            </div>

            <!-- Auction Date -->
            <div class="auction-card-section">
              <p class="auction-card-label">Auction Date</p>
              <div class="auction-card-row">
                <img
                  src="static/images/icon-calendar.svg"
                  alt=""
                  class="auction-card-icon"
                >
                <span class="auction-card-date">${dateHtml}</span>
              </div>
            </div>

            <!-- Auction Time -->
            <div class="auction-card-section">
              <p class="auction-card-label">Auction Time</p>
              <div class="auction-card-row">
                <img
                  src="static/images/icon-clock.svg"
                  alt=""
                  class="auction-card-icon"
                >
                <div class="auction-card-time-wrap">
                  <p class="auction-card-time mb-0">${timeHtml}</p>
                  <p class="auction-card-sub mb-0">Entries Invited</p>
                </div>
              </div>
            </div>

            <!-- Top buttons -->
            <div class="auction-card-actions-top">
              <a href="${window.location.origin}/valuation"
                 class="auction-card-btn auction-card-btn-light">
                Request a valuation
              </a>
              <a href="${window.location.origin}/current_lots"
                 class="auction-card-btn auction-card-btn-light">
                View Lots
              </a>
            </div>

            <!-- Bottom full-width button -->
            <button
              type="button"
              class="auction-card-btn auction-card-btn-primary btn-add-to-calendar"
              data-datetime="${isoDateTime}"
            >
              Add to calendar
            </button>
          </div>
        </div>
      `;

      lotsContainer.insertAdjacentHTML('beforeend', lotHtml);
    });
  } catch (error) {
    console.error('Error setting up lots:', error);
  }
}

// === CALENDAR HOOK-UP ===
function attachCalendarEventListeners() {
  const addToCalendarButtons = document.querySelectorAll('.btn-add-to-calendar');

  addToCalendarButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();

      const isoString = button.dataset.datetime;
      if (!isoString) return;

      const auctionDateTime = new Date(isoString);

      const startTime = formatDateToICS(auctionDateTime);
      const endDt = new Date(auctionDateTime.getTime() + 60 * 60 * 1000); // +1 hour
      const endTime = formatDateToICS(endDt);

      generateAndDownloadICS(startTime, endTime);
    });
  });
}

function formatDateToICS(dateTime) {
  const pad = (num) => (num < 10 ? '0' + num : num);
  return (
    dateTime.getUTCFullYear().toString() +
    pad(dateTime.getUTCMonth() + 1) +
    pad(dateTime.getUTCDate()) +
    'T' +
    pad(dateTime.getUTCHours()) +
    pad(dateTime.getUTCMinutes()) +
    '00Z'
  );
}

function generateAndDownloadICS(startTime, endTime) {
  const uid = `uid-${Date.now()}@swiftpropertyauctions`;
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

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Swift_Auction_Event.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// === DISPLAY HELPERS ===
function formatAuctionDate(date) {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const day = String(date.getDate()).padStart(2, '0');
  const weekday = weekdays[date.getDay()];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  // 17 Tue, February 2026
  return `${day} ${weekday}, ${month} ${year}`;
}

function formatDisplayTime(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();

  // Special-case midday to match design
  if (hours === 12 && minutes === 0) {
    return '12:00 Midday';
  }

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${minutes} ${ampm}`;
}
