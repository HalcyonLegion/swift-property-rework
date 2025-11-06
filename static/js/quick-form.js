// JavaScript Document
$(document).ready(function() {

    "use strict";

    // Changed from form submit event to button click event
    $(".newsletter-form .btn").submit(function() { // Bind click event to the button inside the .newsletter-form
        var form = $(this).closest("form");
        var email = form.find(".email");
        var flag = false;

        if (email.val() == "") {
            email.closest(".form-control").addClass("error");
            email.focus();
            flag = false;
            return false;
        } else {
            email.closest(".form-control").removeClass("error").addClass("success");
            flag = true;
        }

        var dataString = "email=" + email.val();

        $(".loading").fadeIn("slow").html("Loading...");

        $.ajax({
            type: "POST",
            data: dataString,
            url: "/submit-subscription",
            cache: false,
            success: function (d) {
                $(".form-control").removeClass("success");
                if (d == 'success') {
                    $('.loading').fadeIn('slow').html('<font color="#fff">Mail sent Successfully.</font>').delay(3000).fadeOut('slow');
                } else {
                    $('.loading').fadeIn('slow').html('<font color="#fff">Mail not sent.</font>').delay(3000).fadeOut('slow');
                }
            }
        });
    });

    $("#reset").on('click', function() {
        $(".form-control").removeClass("success").removeClass("error");
    });
});