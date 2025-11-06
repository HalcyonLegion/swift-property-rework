// jQuery Document
$(document).ready(function() {

    "use strict";

    $(".contact-form").submit(function(e) {
        e.preventDefault();
        
        var name = $("input[name='name']");
        var email = $("input[name='email']");
        var phone = $("input[name='phone']");
        var budget = $("input[name='budget']");
        var msg = $("textarea[name='message']");
        var flag = true;
        
        // Remove previous errors
        $(".form-control").removeClass("error");

        // Validation for each field
        if (name.val() == "") {
            name.addClass("error");
            name.focus();
            flag = false;
        }
        if (email.val() == "") {
            email.addClass("error");
            email.focus();
            flag = false;
        }
        if (phone.val() == "") {
            phone.addClass("error");
            phone.focus();
            flag = false;
        }
        if (budget.val() == "") {
            budget.addClass("error");
            budget.focus();
            flag = false;
        }
        if (msg.val() == "") {
            msg.addClass("error");
            msg.focus();
            flag = false;
        }
        
        // If there are errors, don't submit
        if (!flag) {
            return false;
        }

        // Prepare data to send
        var data = {
            name: name.val(),
            email: email.val(),
            phone: phone.val(),
            budget: budget.val(),
            message: msg.val()
        };

        // Show loading message
        $(".loading").fadeIn("slow").html("Loading...");

        // AJAX request
        $.ajax({
            type: "POST",
            data: data,
            url: "/submit-privsales-form",
            cache: false,
            success: function (response) {
                // You can customize your success logic and display message
                var responseMessage = response.success ? '<font color="#48af4b">Mail sent Successfully.</font>' : '<font color="#ff5607">Mail not sent.</font>';
                $('.loading').fadeIn('slow').html(responseMessage).delay(3000).fadeOut('slow');
            },
            error: function () {
                // Generic error message
                $('.loading').fadeIn('slow').html('<font color="#ff5607">An error occurred.</font>').delay(3000).fadeOut('slow');
            }
        });

        return false; // Prevent default form submission
    });

    // Resetting form inputs (this part is not in your original code - but you might need reset functionality somewhere)
    $("#reset").on('click', function() {
        $(".form-control").removeClass("success").removeClass("error");
        $(".form-control").val(''); // To clear all the inputs
    });
});