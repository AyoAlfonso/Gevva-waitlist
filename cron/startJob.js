/**
 * Created by mac on 10/15/16.
 */
let fs = require('fs')
let path = require('path');
let connection = require('../controller/db')
let Keys = require('../keys')
let CronJob = require('cron').CronJob;
let bodyParser = require('body-parser')
let sgMail = require('@sendgrid/mail');
let s3FolderUpload = require('s3-folder-upload')
let getCSV = require('get-csv');
let moment = require('moment');
let titleCase = require('title-case');
let Format = require('s3-append').Format;
let request = require('request'),
    throttledRequest = require('throttled-request')(request);
throttledRequest.configure({
    requests: 10,
    milliseconds: 1000
});
require('dotenv').config();

sgMail.setApiKey(Keys.sendgrid.API_KEY);
let API_URL = Keys.config.API_URL;

let now = moment();

module.exports = {
    /** This cron job gets the subcsribers that have spent exactly 4 days on the list and sends them a mail */
    dripJob1: function() {
        var job_a = new CronJob({
            cronTime: "02 14 * * *", //06:40 am (morning) every day.  //  02 14 * * *   // */15 * * * * *  
            onTick: async function() {
                console.log(`We are in the " exactly 4 days" cron job...`)
                let activityCode = "bec5b1dc-b660-4bef-bfe9-d9817c3b28bc";

                let users = await connection.query('SELECT name, email, referral_count, referral_code, created_at, @rownum:=@rownum + 1 as rank FROM subscribers t1 ,' +
                    '(SELECT @rownum := 0) t2 WHERE `dummy` = "false" ORDER BY referral_count DESC, created_at ASC')

                  users.forEach(async function(user) {

                    let userEmail = user.email
                    let existingEntry = await connection.query('SELECT * FROM activities WHERE `email`=(?) AND `activity`=(?)', [userEmail, activityCode])

                    if (existingEntry.length == 0) {
                        
                        let created_at = moment(user.created_at)

                        let dateDifference = (now.diff(created_at, 'days'))
                        console.log(dateDifference + "is the day difference for" + user.email + "with refcode:" + user.referral_code)

                        if (dateDifference == 4) {
                            console.log(`Sending request to the API page with this email detail: ${userEmail}`)

                            if (user) {
                                let userName = user.name || "Nanny"
                                userName = titleCase(userName)

                                let userPosition = user.rank
                                let userReferredCount = user.referral_count
                                let userEmail = user.email
                                let userReferralCode = user.referral_code
                                
                                let senderEmail = {
                                    "email": "help@gevva.co",
                                    "name": "Gevva"
                                }

                                const msg = {
                                    to: userEmail,
                                    from: senderEmail,
                                    subject: `Keep it up!`,
                                    templateId: activityCode,
                                    substitutions: {
                                        name: userName,
                                        userReferralCodeLink: `gevva.co?invite=${userReferralCode}`,
                                        userPosition: userPosition,
                                        userReferredCount: userReferredCount,
                                        userReferralCode: userReferralCode,
                                        // trackingURL: `${API_URL}/imgTracking/nannyfix-logo/${userReferralCode}/${activityCode}`
                                    }
                                }

                                try {
                                    await sgMail.send(msg)
                                    await connection.query('INSERT INTO activities (email, referral_code, activity) VALUES (?, ?, ?)', [userEmail, userReferralCode, activityCode])
                                    console.log("Succesfully sent email to " + userName)
                                } catch (error) {
                                    console.error(error.message)
                                }
                            }
                        } else {
                            console.log(user.name + "Not a 4 day old sub...")
                        }
                    } else {
                        console.log("Entry already exists")
                    }
                })
            },
            start: true,
            timeZone: 'Europe/London'
        });
    },

    /** This cron job gets the subcsribers that have spent at least 10 days on the list and sends them a mail */
    dripJob2: function() {
        var job_a = new CronJob({
            cronTime: "10 14 * * *", //06:45 am (morning) every day in  America //10 14 * * *  //*/15 * * * * * 
            onTick: async function() {
                console.log(`We are in the "least 10 days" dripJob2 cron job...`)
                let activityCode = "0192ea2f-680b-4641-b1c1-5975f7c9337f";
                
                let users = await connection.query('SELECT name, email, referral_count, referral_code, created_at, @rownum:=@rownum + 1 as rank FROM subscribers t1 ,' +
                    '(SELECT @rownum := 0) t2 WHERE `dummy` = "false" ORDER BY referral_count DESC, created_at ASC')

                  users.forEach(async function(user) {

                    let userEmail = user.email

                    let existingEntry = await connection.query('SELECT * FROM activities WHERE `email`=(?) AND `activity`=(?)', [userEmail, activityCode])
                    
                    if (existingEntry.length == 0) {

                        let created_at = moment(user.created_at)
                        let dateDifference = (now.diff(created_at, 'days'))

                        if (dateDifference == 10) {
                            if (user) {
                                let userName = user.name || "Nanny"
                                userName = titleCase(userName)

                                let userPosition = user.rank
                                let userReferredCount = user.referral_count
                                let userEmail = user.email
                                let userReferralCode = user.referral_code

                                let senderEmail = {
                                    "email": "wecare@nannyfix.com",
                                    "name": "NannyFix"
                                }
                                const msg = {
                                    to: userEmail,
                                    from: senderEmail,
                                    subject: `It’s a community...`,
                                    templateId: activityCode,
                                    substitutions: {
                                        name: userName,
                                        userReferralCodeLink: `nannyfix.com/invite/${userReferralCode}`,
                                        userPosition: userPosition,
                                        userReferredCount: userReferredCount,
                                        userReferralCode: userReferralCode,
                                        trackingURL: `${API_URL}/imgTracking/nannyfix-logo/${userReferralCode}/${activityCode}`
                                    }
                                }

                                try {
                                    await sgMail.send(msg)
                                    await connection.query('INSERT INTO activities (email, referral_code, activity) VALUES (?, ?, ?)', [userEmail, userReferralCode, activityCode])
                                    console.log("Succesfully sent email to " + userName)
                                } catch (error) {
                                    console.error(error.message)
                                }
                            }

                        } else {
                            console.log(user.name + " is not a 10 day old sub ...")
                        }
                    } else {
                        console.log("This entry already exists...")
                    }
                })
            },
            start: true,
            timeZone: 'Europe/London'
        });
    },

    /** This cron job gets the subcsribers that have spent at least 14 days on the list and sends them a mail */
    dripJobAfter14Days: function() {
        var job_a = new CronJob({
            cronTime: "15 14 * * * ", //06:45 am (morning) every day in  America //15 14 * * * //*/15 * * * * * 
            onTick: async function() {
                console.log(`We are in the "least 14 days o" dripJob2 cron job...`)
                let activityCode = "9d5968bb-4ca9-4b67-becc-5e4ad1f27fa1";

                let users = await connection.query('SELECT name, email, referral_count, referral_code, created_at, @rownum:=@rownum + 1 as rank FROM subscribers t1 ,' +
                    '(SELECT @rownum := 0) t2 WHERE `dummy` = "false" ORDER BY referral_count DESC, created_at ASC')

                  users.forEach(async function(user) {
                    let userEmail = user.email

                    let existingEntry = await connection.query('SELECT * FROM activities WHERE `email`=(?) AND `activity`=(?)', [userEmail, activityCode])

                    if (existingEntry.length == 0) {

                        let created_at = moment(user.created_at)
                        let dateDifference = (now.diff(created_at, 'days'))
                        if (dateDifference == 14) {


                            if (user) {
                                let userName = user.name || "Nanny"
                                userName = titleCase(userName)

                                let userPosition = user.rank
                                let userReferredCount = user.referral_count
                                let userEmail = user.email
                                let userReferralCode = user.referral_code

                                let senderEmail = {
                                    "email": "wecare@nannyfix.com",
                                    "name": "NannyFix"
                                }

                                const msg = {
                                    to: userEmail,
                                    from: senderEmail,
                                    subject: `It’s life changing…literally`,
                                    templateId: activityCode,
                                    substitutions: {
                                        name: userName,
                                        userReferralCodeLink: `nannyfix.com/invite/${userReferralCode}`,
                                        userPosition: userPosition,
                                        userReferredCount: userReferredCount,
                                        userReferralCode: userReferralCode,
                                        trackingURL: `${API_URL}/imgTracking/nannyfix-logo/${userReferralCode}/${activityCode}`
                                    }
                                }

                                try {
                                    await sgMail.send(msg)
                                    await connection.query('INSERT INTO activities (email, referral_code, activity) VALUES (?, ?, ?)', [userEmail, userReferralCode, activityCode])
                                    console.log("Succesfully sent email to " + userName)
                                } catch (error) {
                                    console.error(error.message)
                                }
                            } else {
                                console.log('Waitlist couldnt find the user email')
                            }

                        } else {
                            console.log(user.name + " is not a 14 day old sub ...")
                        }

                    } else {
                        console.log("This entry exists already...")
                    }
                })
            },
            start: true,
            timeZone: 'Europe/London'
        });
    },

    /** Cron job for exactly 18 Days after sign up  */
    dripJobAfter18Days: function() {
        var job_a = new CronJob({
            cronTime: "18 14 * * *", //06:45 am (morning) every day in  America //18 14 * * *  //*/15 * * * * * 
            onTick: async function() {
                console.log(`We are in the "least 18 days o" dripJob2 cron job...`)
                let activityCode = "c2421bb5-ed07-4b23-b36d-f52c984a24e8";
                let users = await connection.query('SELECT name, email, referral_count, referral_code, created_at, @rownum:=@rownum + 1 as rank FROM subscribers t1 ,' +
                    '(SELECT @rownum := 0) t2 WHERE `dummy` = "false" ORDER BY referral_count DESC, created_at ASC')

                  users.forEach(async function(user) {
                    let userEmail = user.email

                    let existingEntry = await connection.query('SELECT * FROM activities WHERE `email`=(?) AND `activity`=(?)', [userEmail, activityCode])
                    if (existingEntry.length == 0) {

                        let created_at = moment(user.created_at)
                        let dateDifference = (now.diff(created_at, 'days'))
                        if (dateDifference == 18) {

                            if (user) {
                                let userName = user.name || "Nanny"
                                userName = titleCase(userName)

                                let userPosition = user.rank
                                let userReferredCount = user.referral_count
                                let userEmail = user.email
                                let userReferralCode = user.referral_code

                                let senderEmail = {
                                    "email": "wecare@nannyfix.com",
                                    "name": "NannyFix"
                                }

                                const msg = {
                                    to: userEmail,
                                    from: senderEmail,
                                    subject: `Never run out of things to do`,
                                    templateId: activityCode,
                                    substitutions: {
                                        name: userName,
                                        userReferralCodeLink: `nannyfix.com/invite/${userReferralCode}`,
                                        userPosition: userPosition,
                                        userReferredCount: userReferredCount,
                                        userReferralCode: userReferralCode,
                                        trackingURL: `${API_URL}/imgTracking/nannyfix-logo/${userReferralCode}/${activityCode}`
                                    }
                                }

                                try {
                                    await sgMail.send(msg)
                                    await connection.query('INSERT INTO activities (email, referral_code, activity) VALUES (?, ?, ?)', [userEmail, userReferralCode, activityCode])
                                    console.log("Succesfully sent email to " + userName)

                                } catch (error) {
                                    console.error(error.message)
                                }
                            } else {
                                console.log('Waitlist couldnt find the user email ')
                            }

                        } else {
                            console.log(user.name + " is not yet a 18 day old sub ...")
                        }
                    } else {
                        console.log("This entry already exists...")
                    }
                })
            },
            start: true,
            timeZone: 'Europe/London'
        });
    },

    /** This cron job gets the subcsribers that have gotten at least 5 refeers to their accounts and sends them a mail */
    dripJob3: function() {
        var job_a = new CronJob({
            cronTime: "20 14 * * *", //06:50 am (morning) every day in  America 20 14 * * * //*/15 * * * * * 
            onTick: async function() {
                // console.log(`We are in the cron job...`)

                let users = await connection.query('SELECT name, email, referral_count, referral_code, created_at, @rownum:=@rownum + 1 as rank FROM subscribers t1 ,' +
                    '(SELECT @rownum := 0) t2 WHERE `dummy` = "false" ORDER BY referral_count DESC, created_at ASC')

                await request(Keys.config.dropText3, async function(err, response, content) {
                    if (err) {
                        console.log("Error:" + err)
                        return;
                    }
                    users.forEach(async function(user) {
                        if (user.email) {
                            console.log('Checking the validity of sending mails to this email:' + user.email)
                            if (content.indexOf(user.email) == -1) {
                                if (user) {
                                    if (user.referred_count >= 5) {
                                        let userName = user.name || "Nanny"
                                        userName = titleCase(userName)

                                        let userPosition = user.rank
                                        let userReferredCount = user.referral_count
                                        let userEmail = user.email
                                        let userReferralCode = user.referral_code

                                        let senderEmail = {
                                            "email": "wecare@nannyfix.com",
                                            "name": "NannyFix"
                                        }

                                        const msg = {
                                            to: userEmail,
                                            from: senderEmail,
                                            subject: `CONGRATULATIONS!`,
                                            templateId: '0b65d2ef-28fb-4682-9923-a25ffc55ffae',
                                            substitutions: {
                                                name: userName,
                                                userReferralCodeLink: `nannyfix.com/invite/${userReferralCode}`,
                                                userPosition: userPosition,
                                                userReferredCount: userReferredCount,
                                                userReferralCode: userReferralCode,
                                                trackingURL: `${API_URL}/imgTracking/nannyfix-logo/${userReferralCode}/0b65d2ef-28fb-4682-9923-a25ffc55ffae`
                                            }
                                        }
                                        // sgMail.send(msg).then(() => {
                                        //     console.log("Succesfully sent email to " + userName)
                                        //     await connection.query('INSERT INTO activities (email, referral_code, activity) VALUES (?, ?, ?, ?, ?)', [userEmail, userReferralCode , activityCode])

                                        //     var service = new S3Append(config, Keys.config.emails_dripjob3, Format.Text, 'public-read-write');
                                        //     service.append(toEmail)
                                        //     service.flush()
                                        //         .then(function() {
                                        //             console.log("Done Appending email!" + userEmail);
                                        //         })
                                        //         .catch(function(err) {
                                        //             console.error(err.message);
                                        //         });
                                        // }).catch(error => {
                                        //     console.error(error.toString())
                                        // })
                                    } else {
                                        console.log(user.name + "Not yet referred up to 5 people...")
                                    }
                                } else {
                                    console.log('Waitlist couldnt find the user email')
                                }

                            } else {
                                console.log('The user has already been added to the 1st rank of active users ')
                            }
                        } else {
                            console.log("No user!")
                        }
                    })
                })
            },
            start: true,
            timeZone: 'Europe/London'
        });
    },

    /** This cron job gets the subcsribers that have gotten to position number 200 refeers to their accounts and sends them a mail */
    dripJob4: function() {
        var job_a = new CronJob({
            cronTime: "30 14 * * *", //06:55 am (morning) every day in  America 30 14 * * * // */15 * * * * * 
            onTick: async function() {
                // console.log(`We are in the cron job...`)
                let users = await connection.query('SELECT name, email, referral_count, referral_code, created_at, @rownum:=@rownum + 1 as rank FROM subscribers t1 ,' +
                    '(SELECT @rownum := 0) t2 WHERE `dummy` = "false" ORDER BY referral_count DESC, created_at ASC')

                await request(Keys.config.dropText4, async function(err, response, content) {
                    if (err) {
                        console.log("Error:" + err)
                        return;
                    }
                    users.forEach(async function(user) {
                        if (user.email) {
                            console.log('Checking the validity of sending mails to this email:' + user.email)
                            if (content.indexOf(user.email) == -1) {

                                if (user) {
                                    if (user.rank <= 200) {
                                        let userName = user.name || "Nanny"
                                        userName = titleCase(userName)
                                        let userPosition = user.rank
                                        let userReferredCount = user.referral_count
                                        let userEmail = user.email
                                        let userReferralCode = user.referral_code
                                        let senderEmail = {
                                            "email": "wecare@nannyfix.com",
                                            "name": "NannyFix"
                                        }

                                        const msg = {
                                            to: userEmail,
                                            from: senderEmail,
                                            subject: `CONGRATULATIONS!`,
                                            templateId: 'bdf15c90-1f41-4d0d-bfd0-7eb6e8e8fbff',
                                            substitutions: {
                                                name: userName,
                                                userReferralCodeLink: `nannyfix.com/invite/${userReferralCode}`,
                                                userPosition: userPosition,
                                                userReferredCount: userReferredCount,
                                                userReferralCode: userReferralCode
                                            }
                                        }
                                        /*
                                          sgMail.send(msg).then(() => {
                                              console.log("Succesfully sent email to " + userName)
                                              var service = new S3Append(config, 'emails_dripjob4.text', Format.Text, 'public-read-write');
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
                                          */
                                    } else {
                                        console.log(user.name + "Has not yet reached level 200...")
                                    }
                                } else {
                                    console.log('Waitlist couldnt find the user email :' + user.email + user.name)
                                }

                            } else {
                                console.log('The user has already been added to the second rank of active users')
                            }
                        } else {
                            console.log("No user !")
                        }
                    })
                })
            },
            start: true,
            timeZone: 'Europe/London'
        });
    },

    /** This cron job gets the top 20 subscribers and sends them a mail on the last week on the campaign */
    dripJob5: function() {
        var job_a = new CronJob({
            cronTime: "40 14 * * *", //06:58 am (morning) every day in  America 40 14 * * *  //*/15 * * * * * 
            onTick: async function() {
                console.log(`We are in the cron job of 20 subs...`)
                let users = await connection.query('SELECT name, email, referral_count, referral_code, created_at, @rownum:=@rownum + 1 as rank FROM subscribers t1 ,' +
                    '(SELECT @rownum := 0) t2 WHERE `dummy` = "false" ORDER BY referral_count DESC, created_at ASC')


                await request(Keys.config.dropText5, async function(err, response, content) {
                    if (err) {
                        console.log("Error:" + err)
                        return;
                    }

                    users.forEach(async function(user) {
                        if (user.email) {
                            console.log('Checking the validity of sending mails to this email:' + user.email)
                            if (content.indexOf(user.email) == -1) {

                                let userDetails = JSON.parse(body)
                                if (userDetails.email) {
                                    if (1 <= userDetails.position && userDetails.position <= 20) {

                                        let userName = user.name || "Nanny"
                                        userName = titleCase(userName)

                                        let userPosition = user.rank
                                        let userReferredCount = user.referral_count
                                        let userEmail = user.email
                                        let userReferralCode = user.referral_code

                                        let senderEmail = {
                                            "email": "wecare@nannyfix.com",
                                            "name": "NannyFix"
                                        }

                                        const msg = {
                                            to: userEmail,
                                            from: senderEmail,
                                            subject: `You have become a top 20 subscriber!`,
                                            templateId: 'bdf15c90-1f41-4d0d-bfd0-7eb6e8e8fbff',
                                            substitutions: {
                                                name: userName,
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
                                        /*
                                        sgMail.send(msg).then(() => {
                                            console.log("Succesfully sent email to " + userName)
                                            var service = new S3Append(config, 'emails_dripjob5.text', Format.Text, 'public-read-write');
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
                                        */
                                    } else {
                                        console.log(user.name + "Has not yet reached level 20...")
                                    }
                                } else {
                                    console.log('Waitlist couldnt find the user email :' + user.email + user.name)
                                }

                            } else {
                                console.log('The user has already been added to the 3rd rank of active users ')
                            }
                        } else {
                            console.log("No user email!")
                        }
                    })
                })
            },
            start: true,
            timeZone: 'Europe/London'
        });
    },

    // createTestJob: function() {
    //     new CronJob('* * * * * *', function() {
    //        console.log('You will see this message every second');
    //   }, null, true, 'Europe/London');
    // '* * * * * *' - runs every second
    //   '*/5 * * * * *' - runs every 5 seconds
    // '10,20,30 * * * * *' - run at 10th, 20th and 30th second of every minute
    // '0 * * * * *' - runs every minute
    // '0 0 * * * *' - runs every hour (at 0 minutes and 0 seconds)

    // }
};