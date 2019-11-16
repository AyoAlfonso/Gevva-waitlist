const sgMail = require('@sendgrid/mail');
const Keys = require('../keys')
const connection = require('../controller/db')
sgMail.setApiKey(Keys.sendgrid.API_KEY);
let MAIN_URL = Keys.config.SITE_URL;
let API_URL = Keys.config.API_URL;

module.exports = {
    sendWelcomeEmail: async function(subscriberEmail, subscriberName, newUserReferralCode, newUserCurrentPosition, newUserReferralCount) {

        let senderEmail = {
            "email": "help@gevva.co",
            "name": "Gevva"
        }

        let msg = {
            reply_to: senderEmail,
            to: subscriberEmail,
            from: senderEmail,
            subject: `Welcome to Gevva`,
            templateId: 'f2845a5a-c8cc-4c78-a8aa-d0e41c7ec69d',
            substitutions: {
                name: subscriberName,
                userReferralCodeLink: `${MAIN_URL}?invite=${newUserReferralCode}`,
                userPosition: newUserCurrentPosition,
                userReferredCount: newUserReferralCount,
                userVerificationCodeLink: `${MAIN_URL}/verify/${newUserReferralCode}`,
                userReferralCode: newUserReferralCode,
                // trackingURL: `${API_URL}/imgTracking/nannyfix-logo/${newUserReferralCode}/12b7ec45-c144-4885-b7f3-25cf730d0e64`
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
        
        let senderEmail = {
            "email": "help@gevva.co",
            "name": "Gevva"
        }

        let msg = {
            reply_to: senderEmail,
            to: newUserEmail,
            from: senderEmail,
            subject: `You're moving up the ranks!`,
            templateId: '853bad28-416e-4bd8-9199-d3094fb09694',
            substitutions: {
                name: newUserName,
                userReferralCodeLink: `${MAIN_URL}?invite=${newUserReferralCode}`,
                userPosition: newUserCurrentPosition,
                userReferredCount: newUserReferralCount,
                userReferralCode: newUserReferralCode,
                // trackingURL: `${API_URL}/imgTracking/nannyfix-logo/${newUserReferralCode}/31f51ddf-bac8-43d4-bdce-d9f3673980f7`
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

    sendVerificationEmail: async function({newUserName, newUserEmail, newUserReferralCode, newUserReferralCount,newUserCurrentPosition}) {

        let senderEmail = {
            "email": "wecare@nannyfix.com",
            "name": "NannyFix"
        }

        let msg = {
            reply_to: senderEmail,
            to: newUserEmail,
            from: senderEmail,
            subject: `Verify Your Email On The NannyFix Waitlist`,
            templateId: '31f51ddf-bac8-43d4-bdce-d9f3673980f7',
            substitutions: {
                name: newUserName,
                userReferralCodeLink: `${MAIN_URL}/invite/${newUserReferralCode}`,
                userPosition: newUserCurrentPosition,
                userReferredCount: newUserReferralCount,
                userVerificationCodeLink: `${MAIN_URL}/verify/${newUserReferralCode}`,
                userReferralCode: newUserReferralCode,
                trackingURL: `${API_URL}/imgTracking/nannyfix-logo/${newUserReferralCode}/31f51ddf-bac8-43d4-bdce-d9f3673980f7`
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

        let senderEmail = {
            "email": "wecare@nannyfix.com",
            "name": "NannyFix"
        }

        let msg = {
            reply_to: senderEmail,
            to: newUserEmail,
            from: senderEmail,
            subject: `You Have Successfully Verified Your Email`,
            templateId: '25bc96dd-c4c1-4ec0-8d9b-07f05a74a40b',
            substitutions: {
                name: newUserName,
                userReferralCodeLink: `${MAIN_URL}/invite/${newUserReferralCode}`,
                userPosition: newUserCurrentPosition,
                userReferredCount: newUserReferralCount,
                userReferralCode: newUserReferralCode,
                trackingURL: `${API_URL}/imgTracking/nannyfix-logo/${newUserReferralCode}/25bc96dd-c4c1-4ec0-8d9b-07f05a74a40b`
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
        let senderEmail = {
            "email": "wecare@nannyfix.com",
            "name": "NannyFix"
        }

        let msg = {
            reply_to: senderEmail,
            to: subscriberEmail,
            from: senderEmail,
            subject: `Your NannyFix Verification Email Has Been Resent `,
            templateId: '31f51ddf-bac8-43d4-bdce-d9f3673980f7',
            substitutions: {
                name: subscriberName,
                userReferralCodeLink: `${MAIN_URL}/invite/${newUserReferralCode}`,
                userReferredCount: newUserReferralCount,
                userVerificationCodeLink: `${MAIN_URL}/verify/${newUserReferralCode}`,
                userReferralCode: newUserReferralCode,
                trackingURL: `${API_URL}/imgTracking/nannyfix-logo/${newUserReferralCode}/31f51ddf-bac8-43d4-bdce-d9f3673980f7`

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

    sendInviteEmail: async function(subscriberEmail, subscriberName, ReferralCode, subject) {
        let senderEmail = {
            "email": "wecare@nannyfix.com",
            "name": "NannyFix"
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
                trackingURL: `${API_URL}/imgTracking/nannyfix-golden-logo/${ReferralCode}/29738351-e26d-4c69-8f8c-5047146ae04c`
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
            "email": "wecare@nannyfix.com",
            "name": "NannyFix"
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
            "email": "wecare@nannyfix.com",
            "name": "NannyFix"
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