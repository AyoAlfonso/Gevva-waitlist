
        let url = "https://b8139302.ngrok.io/api/v1/"
        
        function getRefcode(variable) {
            var query = window.location.search.substring(8);
            var vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (pair[0] == variable) { return pair[1]; }
            }
            return (undefined);
        }

   

        $('#copyStatus_b').click(function() {
           let refLink = document.getElementById("demosharelink2").innerHTML
            document.getElementById("copyStatus_b").innerHTML = refLink;
            
          });
          
        $('#copyStatus_a').click(function() {
           let refLink = document.getElementById("demosharelink").innerHTML
            document.getElementById("copyStatus_a").innerHTML = refLink
          
         });
    
        function onRequestSubmit() {
            function errorHandler(msg){
                document.getElementById("errorMsg").innerHTML = msg
            }
         
            
            let g = getRefcode('invite')
            console.log(g)
            let e = document.getElementById("senderName").value ? document.getElementById("senderName").value : null
            let t = document.getElementById("senderEmail").value ? document.getElementById("senderEmail").value : null ;
            t = $.trim(t);
            let a = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(t);
           if(!e){
            console.log(e)
            errorHandler('Please check the name inputed')
            return
           }

           if(!a){
             errorHandler('Please check the email inputed')
             return
             }
            if (e && a == true) {
              
                console.log(g)
                $.ajax({
                    type: "POST",
                    url: url + 'newemail',
                  
                    data: {
                        email: t,
                        name: e,
                        refcode: g
                    },
                    beforeSend: function() {
                        $('#errorMsg').html("<img style='height:50px' src='/images/loading-giph.gif' />");
                      },
                    success: function (json) {
                        $('#errorMsg').html("");
                        if (json == undefined) {
                             swal({
                                title: 'Try and sign up!',
                                text: 'Your email doesnt exist on our waiting list',
                                imageUrl: 'images/error.png',
                                imageWidth: 120,
                                imageHeight: 120,
                                animation: false
                            });
                            errorHandler('Try and sign up!')
                            return false
                        }
                        if (json.code == 409) {
                            errorHandler(json.message)
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
                            // document.getElementById("demoreferralnumber").innerHTML = referralCount
                            document.getElementById("demotwitterlink").innerHTML = twitterlink
                            document.getElementById("demowhatsapplink").innerHTML = whatsapplink
                            document.getElementById("demomailto").innerHTML = mailtolink

                            document.getElementById("demosharelink").innerHTML =
                                `Gevva.co/?invite=${userReferralCode}`
                             let refLink = `Gevva.co/?invite=${userReferralCode}`;
                            $('#joinWaitlistModal').modal('hide')
                            $('#joinedWaitlistModal').modal('show')
                          
                            
                        }
                    },
                    error: function (jqXHR, textStatus, err) {
                        if (err) {
                            console.log(err)
                            errorHandler('An error occured')
                            return false
                        }
                    }
                });
            } else {
                errorHandler('Please check the details inputed')
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
                console.log(url + "getuserbyemail")
                $.ajax({
                    type: "POST",
                    url: url + "getuserbyemail",
                    data: {
                        email: y
                    },
                    beforeSend: function() {
                        console.log('fdfdf')
                        $('#errorMsg_a').html("<div style='height:50px'> <img style='height:50px' src='/images/loading-giph.gif' /> </div>");
                      },
                    success: function (json) {
                       
                        $('#errorMsg').html("");
                        if (json.code == 400 ||  500) {
                            $('#errorMsg_a').html(json.message);
                        }
                        if (json.code == 404) {
                            $('#errorMsg_a').html(json.message);
                        }
                        if (json.code == 200) {
                          
                            $('#errorMsg_a').html("");

                            let userReferralCode = json.user.referral_code
                            let numberposition = json.user.position
                            let referralposition = json.user.referral_count


                            let twitterlink = `<a target="_blank" data-toggle="tooltip" href="http://twitter.com/share?text=I%20just%20joined%20Gevva%21%20Join%20Gevva%20too%20and%20get%20exclusive%20early%20access%20to%20the%20Gevva%20app%20now%21&url=https%3A%2F%2Fwww.gevva.co/?invite=${userReferralCode}" >
                                <img src="./images/icons/twitter.svg" alt="twitter icon">
                                </a>`

                            let whatsapplink = `<a target="_blank" href=https://api.whatsapp.com/send?text=I%20just%20joined%20Gevva%21%20Join%20Gevva%20too%20and%20get%20exclusive%20early%20access%20to%20the%20Gevva%20app%20now%20https://www.gevva.co/?invite=${userReferralCode}> <img src="./images/icons/whatsapp.svg" alt="whatsapp icon"> </a>`
                            
                            let mailtolink =  `<a target="_blank" data-original-title="Email" href=mailto:?subject=Check%20This%20Out&body=I%20just%20joined%20Gevva%21%20Join%20Gevva%20too%20and%20get%20exclusive%20early%20access%20to%20the%20Gevva%20app%20now%21%0Ahttps%3A%2F%2Fwww.gevva.co/?invite=${userReferralCode}> <img src="./images/icons/gmail.svg" alt="gmail icon"> </a><br>`

                            // document.getElementById("demofacebooklink2").innerHTML = facebooklink
                            document.getElementById("demotwitterlink2").innerHTML = twitterlink
                            // document.getElementById("demoredditlink2").innerHTML = redditlink
                            document.getElementById("demowhatsapplink2").innerHTML = whatsapplink
                            // document.getElementById("demolinkedinlink2").innerHTML = linkedinlink
                            document.getElementById("demomailto2").innerHTML = mailtolink
                            document.getElementById("demosharelink2").innerHTML =
                                `Gevva.co/?invite=${userReferralCode}`

                            document.getElementById("demopositionnumber2").innerHTML = numberposition
                            document.getElementById("demoreferralnumber2").innerHTML = referralposition
                            $('#checkPositionModal').modal('toggle')
                            $('#checkStatusWaitlistModal').modal('show')
                        }
                    },
                    error: function (err) {
                        
                        if (err) {
                            $('#errorMsg_a').html(err);
                            console.log(err)
                            return false
                        }
                    }
                })
            } else {
                $('#errorMsg_a').html("Please input a valid email");
                
            }
        }
