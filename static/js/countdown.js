// Set the date we're counting down to
var countDownDate = new Date("Feb 17, 2026 12:00:00").getTime();

// Update the countdown every 1 second
var countdownfunction = setInterval(function() {

    // Get today's date and time
    var now = new Date().getTime();

    // Find the distance between now and the countdown date
    var distance = countDownDate - now;

    // Time calculations for days, hours, minutes, and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

    // If the countdown is finished or goes negative, set the values to 0
    if (distance < 0) {
        clearInterval(countdownfunction);
        days = 0;
        hours = 0;
        minutes = 0;
    }

    // Update the days, hours, and minutes
    document.getElementById("days").innerHTML = days;
    document.getElementById("hours").innerHTML = hours;
    document.getElementById("minutes").innerHTML = minutes;

}, 1000);
