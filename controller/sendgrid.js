const sgMail = require('@sendgrid/mail');
var http = require("https");
const request = require('request');
const Keys = require('../keys')
const connection = require('../controller/db')
sgMail.setApiKey(Keys.sendgrid.API_KEY);
let MAIN_URL = Keys.config.SITE_URL;
let API_URL = Keys.config.API_URL;

let senderEmail = {
    "email": "help@gevva.co",
    "name": "Gevva"
}


module.exports = {
    sendWelcomeEmail: async function(subscriberEmail, subscriberName, newUserReferralCode, newUserCurrentPosition, newUserReferralCount) {

        let templateId = '686c22c8-7882-4cf0-8921-8b0ae4f87ee6';
        let msg = {
            reply_to: senderEmail,
            to: subscriberEmail,
            from: senderEmail,
            subject: `Welcome to Gevva`,
            templateId,
            substitutions: {
                name: subscriberName,
                userReferralCodeLink: `${MAIN_URL}?invite=${newUserReferralCode}`,
                userPosition: newUserCurrentPosition,
                userReferredCount: newUserReferralCount,
                userVerificationCodeLink: `${MAIN_URL}/verify/${newUserReferralCode}`,
                userReferralCode: newUserReferralCode,
                trackingURL: `${API_URL}/imgTracking/gevva-logo/${newUserReferralCode}/${templateId}`
            }
        };

        try {
            await sgMail.send(msg)
            await connection.query('INSERT INTO activities (email, referral_code, activity) VALUES (?, ?, ?)', [subscriberEmail, newUserReferralCode, msg.templateId])
            console.log("Succesfully sent email to " + subscriberName)
        } catch (error) {
            console.error(error.message)
        }
    },

    sendInvitationUsedEmail: async function({newUserName, newUserEmail, newUserReferralCode, newUserReferralCount,newUserCurrentPosition}) {
        let templateId = 'ca091bc5-9556-4d02-85c5-bd324bf3d808';
        let msg = {
            reply_to: senderEmail,
            to: newUserEmail,
            from: senderEmail,
            subject: `You're moving up the ranks!`,
            templateId,
            substitutions: {
                name: newUserName,
                userReferralCodeLink: `${MAIN_URL}?invite=${newUserReferralCode}`,
                userPosition: newUserCurrentPosition,
                userReferredCount: newUserReferralCount,
                userReferralCode: newUserReferralCode,
                trackingURL: `${API_URL}/imgTracking/gevva-logo/${newUserReferralCode}/${templateId}`
            }
        };

        try {
            await sgMail.send(msg)
            await connection.query('INSERT INTO activities (email, referral_code, activity) VALUES (?, ?, ?)', [subscriberEmail, ReferralCode, msg.templateId])
            console.log("Succesfully sent email to " + newUserName )
        } catch (error) {
            console.error(error.message)
        }
    },

    addContactToList: async function({first_name, last_name, email }){

        var options = {
                "method": "PUT",
                "hostname": "api.sendgrid.com",
                "port": null,
                "path": "/v3/marketing/contacts",
                "headers": {
                "authorization": `Bearer ${Keys.sendgrid.API_KEY}`,
                "content-type": "application/json"
                }
            };

        let url  = options.hostname + options.path
        let body = { 
                    list_ids: [ Keys.sendgrid.API_KEY ],
                    contacts: 
                    [ {
                        email: 'string (required)',
                        first_name: 'string (optional)',
                        last_name: 'string (optional)',
                    }]
                }
   
        console.log(url)

            request({
                url,
                headers: options.headers,
                body,
                method: options.method
            } , function(error, response, body) {
                if (error) {
                  console.log("Error:"+error)
                  return;
                }
                if(body) {
                    console.log(body)
                    console.log("Successfully added contact")
                    return;
                }
            }
        )
     },
        
    sendVerificationEmail: async function({newUserName, newUserEmail, newUserReferralCode, newUserReferralCount,newUserCurrentPosition}) {

       let templateId = '31f51ddf-bac8-43d4-bdce-d9f3673980f7';
        let msg = {
            reply_to: senderEmail,
            to: newUserEmail,
            from: senderEmail,
            subject: `Verify Your Email On The NannyFix Waitlist`,
            templateId,
            substitutions: {
                name: newUserName,
                userReferralCodeLink: `${MAIN_URL}/invite/${newUserReferralCode}`,
                userPosition: newUserCurrentPosition,
                userReferredCount: newUserReferralCount,
                userVerificationCodeLink: `${MAIN_URL}/verify/${newUserReferralCode}`,
                userReferralCode: newUserReferralCode,
                trackingURL: `${API_URL}/imgTracking/gevva-logo/${newUserReferralCode}/${templateId}`
            }
        };

        try {
            await sgMail.send(msg)
            await connection.query('INSERT INTO activities (email, referral_code, activity) VALUES (?, ?, ?)', [subscriberEmail, ReferralCode, msg.templateId])
            console.log("Succesfully sent email to " + newUserName )
        } catch (error) {
            console.error(error.message)
        }
    },

    successfulVerificationEmail: async function(newUserName, newUserEmail, newUserReferralCode, newUserReferralCount, newUserCurrentPosition) {

        let templateId = '25bc96dd-c4c1-4ec0-8d9b-07f05a74a40b'

        let msg = {
            reply_to: senderEmail,
            to: newUserEmail,
            from: senderEmail,
            subject: `You Have Successfully Verified Your Email`,
            templateId,
            substitutions: {
                name: newUserName,
                userReferralCodeLink: `${MAIN_URL}/invite/${newUserReferralCode}`,
                userPosition: newUserCurrentPosition,
                userReferredCount: newUserReferralCount,
                userReferralCode: newUserReferralCode,
                trackingURL: `${API_URL}/imgTracking/nannyfix-logo/${newUserReferralCode}/${templateId}`
            }
        };

        try {
            await sgMail.send(msg)
            await connection.query('INSERT INTO activities (email, referral_code, activity) VALUES (?, ?, ?)', [newUserEmail, newUserReferralCode, msg.templateId])
            console.log("Succesfully sent email to " + newUserName)
        } catch (error) {
            console.error(error.message)
        }
    },

    resendVerificationEmail: async function(subscriberEmail, subscriberName, newUserReferralCode, newUserReferralCount) {
     
        let templateId = '31f51ddf-bac8-43d4-bdce-d9f3673980f7';

        let msg = {
            reply_to: senderEmail,
            to: subscriberEmail,
            from: senderEmail,
            subject: `Your NannyFix Verification Email Has Been Resent `,
            templateId,
            substitutions: {
                name: subscriberName,
                userReferralCodeLink: `${MAIN_URL}/invite/${newUserReferralCode}`,
                userReferredCount: newUserReferralCount,
                userVerificationCodeLink: `${MAIN_URL}/verify/${newUserReferralCode}`,
                userReferralCode: newUserReferralCode,
                trackingURL: `${API_URL}/imgTracking/nannyfix-logo/${newUserReferralCode}/${templateId}`

            }
        };
        try {
            await sgMail.send(msg)
            await connection.query('INSERT INTO activities (email, referral_code, activity) VALUES (?, ?, ?)', [subscriberEmail, newUserReferralCode, msg.templateId])
            console.log("Succesfully sent email to " + newUserName)
        } catch (error) {
            console.error(error.message)
        }
    },

    sendManualInviteEmail: async function(subscriberEmail, subscriberName, subject){

        let templateId = '42937bd8-3b49-4af7-b8e2-5ba7e61767ce';
        let toEmail = subscriberEmail
        let msg = {
            reply_to: senderEmail,
            to: toEmail,
            from: senderEmail,
            subject: subject,
            templateId,
            substitutions: {
                name: subscriberName,
                userManualReferralCodeLink: `${MAIN_URL}?manual-invite=${toEmail}`,
                referrer_name: '12234admin',
                trackingURL: `${API_URL}/imgTracking/nannyfix-golden-logo/${ReferralCode}/${templateId}`
            }
        };

        try {
            await sgMail.send(msg)
          console.log("Succesfully sent manual ivitation email to " + subscriberName)
        } catch (error) {
            console.error(error.message)
        }
        
    },

    sendInviteEmail: async function(subscriberEmail, subscriberName, ReferralCode, subject) {
       
        let templateId = '29738351-e26d-4c69-8f8c-5047146ae04c';
        let toEmail = subscriberEmail
        let msg = {
            reply_to: senderEmail,
            to: toEmail,
            from: senderEmail,
            subject: subject,
            templateId,
            substitutions: {
                name: subscriberName,
                userReferralCodeLink: `${MAIN_URL}/invite/${ReferralCode}`,
                userVerificationCodeLink: `${MAIN_URL}/verify/${ReferralCode}`,
                userReferralCode: ReferralCode,
                trackingURL: `${API_URL}/imgTracking/nannyfix-golden-logo/${ReferralCode}/${templateId}`
            }
        };

        try {
            await sgMail.send(msg)
            await connection.query('INSERT INTO activities (email, referral_code, activity) VALUES (?, ?, ?)', [subscriberEmail, ReferralCode, msg.templateId])
          console.log("Succesfully sent email to " + newUserName)
        } catch (error) {
            console.error(error.message)
        }

    },

    sendReinviteEmail: async function({subscriberEmail, subscriberName, ReferralCode, subject, trackingCode}) {
        let senderEmail = {
            "email": "help@gevva.co",
            "name": "Gevva"
        }


        let toEmail = subscriberEmail
        let msg = {
            reply_to: senderEmail,
            to: toEmail,
            from: senderEmail,
            subject: subject,
            templateId: '29738351-e26d-4c69-8f8c-5047146ae04c',
            substitutions: {
                name: subscriberName,
                userReferralCodeLink: `${MAIN_URL}/invite/${ReferralCode}`,
                userVerificationCodeLink: `${MAIN_URL}/verify/${ReferralCode}`,
                userReferralCode: ReferralCode,
                trackingURL: `${API_URL}/imgTracking/nannyfix-golden-logo/${ReferralCode}/${trackingCode}`
            }
        };

        try {
            await sgMail.send(msg)
            await connection.query('INSERT INTO activities (email, referral_code, activity) VALUES (?, ?, ?)', [subscriberEmail, ReferralCode, trackingCode])
            console.log("Succesfully sent email to " + newUserName)
        } catch (error) {
            console.error(error.message)
        }
    },

    sendInviteEmailV2: async function({subscriberEmail, subscriberName, ReferralCode, subject, trackingCode}) {
        let senderEmail = {
            "email": "help@gevva.co",
            "name": "Gevva"
        }


        let toEmail = subscriberEmail
        let msg = {
            reply_to: senderEmail,
            to: toEmail,
            from: senderEmail,
            subject: subject,
            templateId:"1ac0fb71-0b97-4e4e-a35e-5cadb737acce",
            substitutions: {
                name: subscriberName,
                userReferralCodeLink: `${MAIN_URL}/invite/${ReferralCode}`,
                userVerificationCodeLink: `${MAIN_URL}/verify/${ReferralCode}`,
                userReferralCode: ReferralCode,
                trackingURL: `${API_URL}/imgTracking/nannyfix-golden-logo/${ReferralCode}/${trackingCode}`
            }
        };

        try {
            await sgMail.send(msg)
            await connection.query('INSERT INTO activities (email, referral_code, activity) VALUES (?, ?, ?)', [subscriberEmail, ReferralCode, trackingCode])
            console.log("Succesfully sent email to " + newUserName)
        } catch (error) {
            console.error(error.message)
        }
    },
}