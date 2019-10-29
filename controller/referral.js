const express = require('express');
const Keys = require('../keys')
const sgMail = require('@sendgrid/mail');
const request = require('request');

var Format = require('s3-append').Format;
var S3Config = require('s3-append').S3Config;
var titleCase = require('title-case');
var config = new S3Config({
    "accessKeyId": "AKIAI7C2USFYPFULQXEQ",
    "secretAccessKey": "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",
    "region": "us-east-2",
    "bucket": "nannyfix-campaign"
});

let S3Append = require('s3-append').S3Append;
sgMail.setApiKey(Keys.sendgrid.API_KEY);

//Daily Summary of Referrals Sent 
module.exports = {
    getReferral : async function(email,referee){
     
        const url = `https://nannyfix.app.waitlisted.co/api/v2/reservations?email=${email}`
                               // console.log(`Sending request to the API page with this email detail: ${user.email}`)
                                request(url, function(error, response, body) {
                                    if (error) {
                                      console.log("Error:"+error)
                                      return;
                                    }
                                   let userDetails = JSON.parse(body)
                                        let userName = titleCase(userDetails.name)
                                        let userReferredBy = userDetails.referred_by
                                        let userPosition = userDetails.position
                                        let userReferredCount = userDetails.referred_count
                                        let userEmail = userDetails.email
                                        let userReferralCode = userDetails.affiliate
                                        let senderEmail = {
                                            "email": "wecare@nannyfix.com",
                                            "name": "NannyFix"
                                        }
                                        let toEmail = userEmail
                                        let twittershare = `http://twitter.com/share?text=I%20just%20joined%20NannyFix%21%20Join%20NannyFix%20too%20and%20get%20exclusive%20early%20access%20to%20the%20NannyFix%20app%20now%21&url=https%3A%2F%2Fwww.nannyfix.com%2F%3Frefcode=${userReferralCode}`
                                        let facebookshare = `https://www.facebook.com/dialog/feed?app_id=660780480720000&display=popup&t=I%20just%20joined%20NannyFix%21%20Join%20NannyFix%20too%20and%20get%20exclusive%20early%20access%20to%20the%20NannyFix%20app%20now&link=https%3A%2F%2Fwww.nannyfix.com%2F%3Frefcode=${userReferralCode}&redirect_uri=https%3A%2F%2Fwww.waitlisted.co%2Fsocial%2Ffb`
                                        let redditshare = `https://www.reddit.com/submit?url=https%3A%2F%2Fwww.nannyfix.com%2F%3Frefcode=${userReferralCode}&title=I%20just%20joined%20NannyFix%21%20Join%20NannyFix%20too%20and%20get%20exclusive%20early%20access%20to%20the%20NannyFix%20app%20now`
                                        let whatsappshare = `https://api.whatsapp.com/send?text=I%20just%20joined%20NannyFix%21%20Join%20NannyFix%20too%20and%20get%20exclusive%20early%20access%20to%20the%20NannyFix%20app%20now%20https://www.nannyfix.com/?refcode=${userReferralCode}`
                                        let linkedinshare = `https://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fwww.nannyfix.com/%2F%3Frefcode=${userReferralCode}&title=Nannyfix&summary=I%20just%20joined%20NannyFix%21%20Join%20NannyFix%20too%20and%20get%20exclusive%20early%20access%20to%20the%20NannyFix%20app%20now&source=LinkedIn`
                                        let mailshare = `mailto:?subject=Email%20Subject&body=I%20just%20joined%20NannyFix%21%20Join%20NannyFix%20too%20and%20get%20exclusive%20early%20access%20to%20the%20NannyFix%20app%20now%21%0Ahttps%3A%2F%2Fwww.nannyfix.com/%2F%3Frefcode=${userReferralCode}`
                                       
                                        const msg = {
                                            to: toEmail,
                                            from: senderEmail,
                                            subject: `${referee} signed up on NannyFix`,
                                            templateId: 'aba5c900-44b2-4d76-8dee-c7e57e4b5612', //Change this..
                                            substitutions: {
                                                name: userName,
                                                refereeName: referee,
                                                userReferralCodeLink: `nannyfix.com/invite/${userReferralCode}`,
                                                userPosition: userPosition,
                                                userReferredCount: userReferredCount,
                                                redditshare: redditshare,
                                                facebookshare: facebookshare,
                                                twittershare: twittershare,
                                                whatsappshare: whatsappshare,
                                                linkedinshare: linkedinshare,
                                                mailshare: mailshare
                                            }
                                        }
                                        console.log("Sending mail to " + toEmail)
                                        sgMail.send(msg).then((response) => {
                                            
                                            console.log("Succesfully sent email to " + userName)
                                            var service = new S3Append(config, Keys.config.emails_dripjob6, Format.Text, 'public-read-write');
                                            service.append(toEmail);
                                            service.flush()
                                                .then(function() {
                                                    console.log("Done Appending email!" + toEmail);
                                                })
                                                .catch(function(err) {
                                                    console.error(err.message);
                                                });
                                        }).catch(error => {
                                            console.error(error.toString())
                    })
              }
           )
   }}
