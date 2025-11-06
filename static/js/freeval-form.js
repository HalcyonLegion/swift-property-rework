$(document).ready(function() {

    "use strict";

    $(".contact-form").submit(function(e) {
        e.preventDefault();

        var name = $(".name");
        var email = $(".email");
        var phone = $(".phone");
        var address = $(".address");
        var town = $(".town");
        var postcode = $(".postcode");
        var type = $(".type");
        var further = $(".further-information");
        var flag = true;

        // Removing error class for all form-control elements
        $(".form-control").removeClass("error");

        // Name validation
        if (name.val().trim() === "") {
            name.addClass("error");
            name.focus();
            flag = false;
        }

        // Email validation with regex
        var regexEmail = /^[^@]+@[^@]+\.[^@]+$/;
        if (email.val().trim() === "" || !regexEmail.test(email.val().trim())) {
            email.addClass("error");
            email.focus();
            flag = false;
        }

        // Simple normalization and validation for phone numbers (e.g., removing spaces and dashes)
        var formattedPhoneNumber = phone.val().replace(/[\s-]/g, '');
        if (formattedPhoneNumber !== "" && !/^\d+$/.test(formattedPhoneNumber)) {
            phone.addClass("error");
            phone.val(''); // clear invalid input
            phone.attr("placeholder", "Invalid number, use digits only");
            phone.focus();
            flag = false;
        } else {
            phone.val(formattedPhoneNumber);
        }

        // Property type validation
        if (type.val() == "Property Type") {
            type.addClass("error");
            type.focus();
            flag = false;
        }

        // Further information is not mandatory but if you want to check for empty string
        if (further.val().trim() === "") {
            further.addClass("error");
            further.focus();
            flag = false;
        }

        // Proceed only if there are no validation errors
        if (!flag) {
            return false;
        }

        var data = {
            name: name.val(),
            email: email.val(),
            phone: phone.val(),
            address: address.val(),
            town: town.val(),
            postcode: postcode.val(),
            propertyType: type.find(':selected').text(),
            furtherInformation: further.val()
        };

        $(".loading").fadeIn("slow").html("Loading...");

        $.ajax({
            type: "POST",
            data: data,
            url: "/submit-freeval-form",
            dataType: 'json', // Expecting JSON response (make sure your server sends this)
            cache: false,
            success: function (response) {
                var responseMessage = response.success ? '<font color="#48af4b">Form submission Successful.</font>' : '<font color="#ff5609">Form submission failed.</font>';
                $('.loading').fadeIn('slow').html(responseMessage).delay(3000).fadeOut('slow');
            },
            error: function (xhr, status, error) {
                console.error('AJAX Error:', status, error);
                $('.loading').fadeIn('slow').html('<font color="#ff5609">An error occurred during form submission: ' + xhr.responseText + '</font>').delay(3000).fadeOut('slow');
            }
        });

        return false;
    });

    $("#reset").on('click', function() {
        $(".form-control").removeClass("success").removeClass("error");
    });
});