
        let url = "https://gevva-waitlist.herokuapp.com/api/v1/"
        
        function getRefcode(variable) {
            var query = window.location.search.substring(1);
            var vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (pair[0] == variable) { return pair[1]; }
            }
            return (undefined);
        }

        function copyRefCode() {
            document.getElementById("demosharelink").select(), document.execCommand("Copy")
            swal({
                title: "Sucess",
                text: "Invitation Code copied",
                timer: 5000,
                toast: true,
              });
        }

        function onRequestSubmit() {
            let g = getRefcode('r')
            let e = document.getElementById("senderName").value || document.getElementById("senderName2").value;
            let t = document.getElementById("senderEmail").value || document.getElementById("senderEmail2").value;
            t = $.trim(t);
            let a = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(t);
            if (e && a == true) {
              
                $.ajax({
                    type: "POST",
                    url: url + 'newmail',
                    data: {
                        email: t,
                        name: e,
                        refcode: g
                    },
                    success: function (json) {
                        if (json == undefined) {
                            return swal({
                                title: 'Try and sign up!',
                                text: 'Your email doesnt exist on our waiting list',
                                imageUrl: 'images/error.png',
                                imageWidth: 120,
                                imageHeight: 120,
                                animation: false
                            });
                            return false
                        }
                        if (json.code == 409) {
                            return swal({
                                title: 'Try again!',
                                text: json.message,
                                imageUrl: 'images/error.png',
                                imageWidth: 120,
                                imageHeight: 120,
                                animation: false
                            });
                            return false
                        }
                        if (json.code == 200) {
                            let userReferralCode = json.user.referral_code
                            let positionNumber = json.user.position
                            let referralCount = json.user.referral_count

                            let twitterlink =
                                `<a target="_blank" data-toggle="tooltip" href="http://twitter.com/share?text=I%20just%20joined%20Gevva%21%20Join%20Gevva%20too%20and%20get%20exclusive%20early%20access%20to%20the%20Gevva%20app%20now%21&url=https%3A%2F%2Fwww.gevva.co/?invite=${userReferralCode}" >
                                <img src="./images/icons/twitter.svg" alt="twitter icon">
                                </a>`

                            let whatsapplink =
                                `<a target="_blank" href=https://api.whatsapp.com/send?text=I%20just%20joined%20Gevva%21%20Join%20Gevva%20too%20and%20get%20exclusive%20early%20access%20to%20the%20Gevva%20app%20now%20https://www.gevva.co/?invite=${userReferralCode}> <img src="./images/icons/whatsapp.svg" alt="whatsapp icon"> </a>`
                            
                            let mailtolink =
                                `<a target="_blank" data-original-title="Email" href=mailto:?subject=Check%20This%20Out&body=I%20just%20joined%20Gevva%21%20Join%20Gevva%20too%20and%20get%20exclusive%20early%20access%20to%20the%20Gevva%20app%20now%21%0Ahttps%3A%2F%2Fwww.gevva.co/?invite=${userReferralCode}> <img src="./images/icons/gmail.svg" alt="gmail icon"> </a><br>`
                            document.getElementById("demopositionnumber").innerHTML = positionNumber
                            document.getElementById("demoreferralnumber").innerHTML = referralCount
                            document.getElementById("demotwitterlink").innerHTML = twitterlink
                            document.getElementById("demowhatsapplink").innerHTML = whatsapplink
                            document.getElementById("demomailto").innerHTML = mailtolink

                            document.getElementById("demosharelink").value =
                                `Gevva.co/?invite=${userReferralCode}`
                                
                            $('#joinedWaitlistModal').modal('show')
                        }
                    },
                    error: function (jqXHR, textStatus, err) {
                        if (err) {
                            swal({
                                title: 'Try again!',
                                text: 'An error occured',
                                imageUrl: 'images/error.png',
                                imageWidth: 120,
                                imageHeight: 120,
                                animation: false,
                            });
                            return false
                        } else {
                            swal.stopLoading();
                            swal.close();
                        }
                    }
                });
            } else {
                swal({
                    title: 'Wrong details',
                    text: 'Please check your details for spaces and omissions',
                    imageUrl: 'images/error.png',
                    imageWidth: 120,
                    imageHeight: 120,
                    animation: false
                });
                return false
            }
        }

        function onCheckSubmit() {
            let y = document.getElementById("checkEmail").value;
            y = $.trim(y)
            let Email =
                /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
                    .test(y)
            if (Email == true) {
                $.ajax({
                    type: "POST",
                    url: "/getuserbyemail",
                    data: {
                        email: y
                    },
                    success: function (json) {
                        if (json.code == 400) {
                            return swal({
                                title: 'This is not valid!',
                                text: json.message,
                                imageUrl: 'images/error.png',
                                imageWidth: 120,
                                imageHeight: 120,
                                animation: false
                            });
                            return false
                        }
                        if (json.code == 404) {
                            return swal({
                                title: 'Try and sign up!',
                                text: 'Your email doesnt exist on our waiting list',
                                imageUrl: 'images/error.png',
                                imageWidth: 120,
                                imageHeight: 120,
                                animation: false
                            });
                            return false
                        }
                        if (json.code == 200) {
                            let userReferralCode = json.user.referral_code
                            let numberposition = json.user.position
                            let referralposition = json.user.referral_count


                            let twitterlink =
                                `<a target="_blank" data-toggle="tooltip" href="http://twitter.com/share?text=I%20just%20joined%20Gevva%21%20Join%20Gevva%20too%20and%20get%20exclusive%20early%20access%20to%20the%20Gevva%20app%20now%21&url=https%3A%2F%2Fwww.gevva.co/?invite=${userReferralCode}" >
                                <img src="./images/icons/twitter.svg" alt="twitter icon">
                                </a>`

                            let whatsapplink =
                                `<a target="_blank" href=https://api.whatsapp.com/send?text=I%20just%20joined%20Gevva%21%20Join%20Gevva%20too%20and%20get%20exclusive%20early%20access%20to%20the%20Gevva%20app%20now%20https://www.gevva.co/?invite=${userReferralCode}> <img src="./images/icons/whatsapp.svg" alt="whatsapp icon"> </a>`
                            
                            let mailtolink =
                                `<a target="_blank" data-original-title="Email" href=mailto:?subject=Check%20This%20Out&body=I%20just%20joined%20Gevva%21%20Join%20Gevva%20too%20and%20get%20exclusive%20early%20access%20to%20the%20Gevva%20app%20now%21%0Ahttps%3A%2F%2Fwww.gevva.co/?invite=${userReferralCode}> <img src="./images/icons/gmail.svg" alt="gmail icon"> </a><br>`

                            document.getElementById("demofacebooklink2").innerHTML = facebooklink
                            document.getElementById("demotwitterlink2").innerHTML = twitterlink
                            document.getElementById("demoredditlink2").innerHTML = redditlink
                            document.getElementById("demowhatsapplink2").innerHTML = whatsapplink
                            document.getElementById("demolinkedinlink2").innerHTML = linkedinlink
                            document.getElementById("demomailto2").innerHTML = mailtolink
                            document.getElementById("demosharelink2").value =
                                `Gevva.co/?invite=${userReferralCode}`

                            document.getElementById("demopositionnumber2").innerHTML = numberposition
                            document.getElementById("demoreferralnumber2").innerHTML = referralposition
                            $('#checkStatusWaitlistModal').modal('show')
                        }
                    },
                    error: function (jqXHR, textStatus, err) {
                        if (err) {
                            swal({
                                title: 'Try again!',
                                text: 'An error occured',
                                imageUrl: 'images/error.png',
                                imageWidth: 120,
                                imageHeight: 120,
                                animation: false,
                            });
                            return false
                        } else {
                            swal.stopLoading();
                            swal.close();
                        }
                    }
                })
            } else {
                swal({
                    title: 'Wrong details',
                    text: 'Please check your email',
                    imageUrl: 'images/error.png',
                    imageWidth: 120,
                    imageHeight: 120,
                    animation: false
                });
                return false
            }
        }
