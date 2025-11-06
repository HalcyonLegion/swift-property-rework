document.addEventListener('DOMContentLoaded', function() {
    function formatDateToICS(dateTime) {
        const pad = (num) => (num < 10 ? '0' + num : num);
        return `${dateTime.getUTCFullYear()}${pad(dateTime.getUTCMonth() + 1)}${pad(dateTime.getUTCDate())}T${pad(dateTime.getUTCHours())}${pad(dateTime.getUTCMinutes())}00Z`;
    }

    const auctionDateTimeText = document.querySelector('.simple-countdown p.text-white.p-lg').innerText;
    const dateTimeParts = auctionDateTimeText.match(/(\d{1,2})(?:th|nd|rd|st)? (\w+) (\d{4}) (\d{1,2}):(\d{2})(am|pm)/i);

    const months = {
        January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
        July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
    };
    
    if (dateTimeParts) {
        let hour = parseInt(dateTimeParts[4], 10);
        // Adjusting for AM/PM
        if (dateTimeParts[6].toLowerCase() === 'pm' && hour !== 12) hour += 12;
        if (dateTimeParts[6].toLowerCase() === 'am' && hour === 12) hour = 0;
    
        let auctionDateTime = new Date(
            parseInt(dateTimeParts[3], 10), // year
            months[dateTimeParts[2]],       // month
            parseInt(dateTimeParts[1], 10), // day
            hour,
            parseInt(dateTimeParts[5], 10)  // minute
        );
        
        // Calculate UTC times for .ics format
        const startTime = formatDateToICS(auctionDateTime);
        auctionDateTime.setHours(auctionDateTime.getHours() + 1); // Assuming 1 hour duration
        const endTime = formatDateToICS(auctionDateTime);

        const addToCalendarLink = document.querySelector('a.btn3[href="#add-calendar"]');
        if(addToCalendarLink) {
            addToCalendarLink.addEventListener('click', function(e) {
                e.preventDefault();
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

                const blob = new Blob([icsContent], {type: 'text/calendar;charset=utf-8'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'AuctionEvent.ics';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });
        }
    } else {
        // Handling the case where the date time parsing fails
        console.error('Failed to parse date time');
    }
});