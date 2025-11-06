$(document).ready(function() {

    "use strict";

    $(".contact-form").submit(function(e) {
        e.preventDefault();
        
        var firstName = $("input[name='first_name']");
        var lastName = $("input[name='last_name']");
        var email = $("input[name='email']");
        var telephone = $("input[name='telephone']");
        var message = $("textarea[name='message']");
        var loadingMsg = $(".contact-form-msg .loading");
        var propertyAddress = $("input[name='property_address']");
        var flag = true;
        
        // Clear previous error states
        $(".form-control").removeClass("error");

        // Validation checks
        if (firstName.val() == "") {
            firstName.addClass("error");
            firstName.focus();
            flag = false;
        }
        if (lastName.val() == "") {
            lastName.addClass("error");
            lastName.focus();
            flag = false;
        }
        if (email.val() == "") {
            email.addClass("error");
            email.focus();
            flag = false;
        }
        if (telephone.val() == "") {
            telephone.addClass("error");
            telephone.focus();
            flag = false;
        }
        if (message.val() == "") {
            message.addClass("error");
            message.focus();
            flag = false;
        }

        // Stop the form submission if there are validation errors
        if (!flag) {
            return false;
        }
        
        // Prepare data to be sent
        var data = {
            first_name: firstName.val(),
            last_name: lastName.val(),
            email: email.val(),
            telephone: telephone.val(),
            message: message.val(),
            property_address: propertyAddress.val()  // Add this line
        };

        loadingMsg.fadeIn("slow").html("Loading...");

        // POST to server
        $.ajax({
            type: "POST",
            data: data,
            url: "/submit-enquiry-form", // Update the URL if required
            cache: false,
            success: function (response) {
                var responseMessage = response.success ? '<font color="#48af4b">Enquiry submitted successfully.</font>' 
                                                       : '<font color="#ff5607">Failed to submit enquiry.</font>';
                loadingMsg.fadeIn('slow').html(responseMessage).delay(3000).fadeOut('slow');
            },
            error: function () {
                loadingMsg.fadeIn('slow').html('<font color="#ff5607">An error occurred.</font>').delay(3000).fadeOut('slow');
            }
        });
        
        return false; // Prevent default form submission
    });

    // Clear error or success state if reset button implemented
    // $("#reset").on('click', function () {
    //     $(".form-control").removeClass("error");
    // });
});