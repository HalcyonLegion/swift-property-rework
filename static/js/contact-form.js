// JavaScript Document
$(document).ready(function() {

    "use strict";

    $(".contact-form").submit(function(e) {
        e.preventDefault();
        
        var name = $(".name");
        var email = $(".email");
        var subject = $(".subject");
        var msg = $(".message");
        var flag = true;
        
        $(".form-control").removeClass("error");

        if (name.val() == "") {
            name.closest(".input-subject").addClass("error");
            name.focus();
            flag = false;
        }
        if (email.val() == "") {
            email.closest(".input-subject").addClass("error");
            email.focus();
            flag = false;
        }
        if (subject.val() == "This question is about...") {
            subject.closest(".input-subject").addClass("error");
            subject.focus();
            flag = false;
        }
        if (msg.val() == "") {
            msg.closest(".input-subject").addClass("error");
            msg.focus();
            flag = false;
        }
        if (!flag) {
            return false;
        }
        
        $(".input-subject").removeClass("error");
        
        var data = {
            name: name.val(),
            email: email.val(),
            subject: subject.find(':selected').text(), // Capture the selected option text
            message: msg.val()
        };

        $(".loading").fadeIn("slow").html("Loading...");

        $.ajax({
            type: "POST",
            data: data,
            url: "/submit-form",
            cache: false,
            success: function (response) {
                $(".input-subject").removeClass("success");
                var responseMessage = response.success ? '<font color="#48af4b">Mail sent Successfully.</font>' : '<font color="#ff5607">Mail not sent.</font>';
                $('.loading').fadeIn('slow').html(responseMessage).delay(3000).fadeOut('slow');
            },
            error: function () {
                $('.loading').fadeIn('slow').html('<font color="#ff5607">An error occurred.</font>').delay(3000).fadeOut('slow');
            }
        });
        return false;
    });

    $("#reset").on('click', function() {
        $(".form-control").removeClass("success").removeClass("error");
    });
});