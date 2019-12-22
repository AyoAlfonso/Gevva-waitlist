let express = require('express');
let router = express.Router();
let Keys = require('../keys')
let sgMail = require('@sendgrid/mail')
let titleCase = require('title-case')
let connection = require('../controller/db')
let authController = require('../controller/auth')
let sendgridController = require('../controller/sendgrid')
let date = require('date-and-time');
let shortid = require('shortid-36')
let moment = require('moment')
let gravatar = require('gravatar');
sgMail.setApiKey(Keys.sendgrid.API_KEY);

function* range(start, end) {
    while (start <= end)
        yield start++
}

async function newMemberRegsitration(subscriberEmail,refcode, subscriberName, plan, res, invitation){
    subscriberName = titleCase(subscriberName);

    let existingUser = await connection.query('SELECT email FROM subscribers WHERE `email`=(?)', [subscriberEmail])
    if (existingUser.length !== 0) {
        return res.json({
            message: 'Someone aleady subscribed with this mail!',
            code: 409
        })
        
      
    } else {

        if(invitation){
            return;
        }

        try {
            let referralCode = shortid.generate().toLowerCase()
           
            let user = await connection.query(
                'SELECT * FROM (  SELECT name, email, referral_count, referral_code, referred_by, @rownum:=@rownum + 1 as position FROM subscribers t1,' +
                '(SELECT @rownum := 0) t2 ORDER BY referral_count DESC, created_at ASC) t1 WHERE `referral_code`=(?)', [refcode])

            if (user.length !== 0) {
                let referred_by = user[0].email
                await connection.query('INSERT INTO subscribers (email, name, referral_code, referred_by) VALUES (?, ?, ?, ?)', [subscriberEmail, subscriberName, referralCode, referred_by])
                await connection.query('UPDATE subscribers SET referral_count = referral_count + 1 WHERE `referral_code`=(?)', [refcode])
                await sendgridController.sendInvitationUsedEmail({
                    newUserName: user[0].name,
                    newUserEmail: user[0].email,
                    newUserReferralCode: user[0].referral_code,
                    newUserReferralCount: user[0].referral_count + 1,
                    newUserCurrentPosition: user[0].position
                })
            } else if (user.length == 0) {
               await connection.query('INSERT INTO subscribers (email, name, referral_code, plan) VALUES (?, ?, ?, ?)', [subscriberEmail, subscriberName, referralCode, plan])
            }

            let newUser = await connection.query(
                'SELECT * FROM (  SELECT name, email, referral_count, referral_code, referred_by, @rownum:=@rownum + 1 as position FROM subscribers t1,' +
                '(SELECT @rownum := 0) t2 ORDER BY referral_count DESC, created_at ASC) t1 WHERE `referral_code`=(?)', [referralCode])
            
                names = subscriberName.split(" ");
                names[1] = names[1] ? names[1] : null

           await sendgridController.addContactToList({first_name : names[0], last_name: names[1], email: newUser[0].email})

            let newUserReferralCode = newUser[0].referral_code
            let newUserCurrentPosition = newUser[0].position
            let newUserReferralCount = newUser[0].referral_count

            await sendgridController.sendWelcomeEmail(subscriberEmail, subscriberName, newUserReferralCode, newUserCurrentPosition, newUserReferralCount)

            return res.status(200).json({
                user: newUser[0],
                code: 200
            })

        } catch (error) {
            console.log(error)
            return res.status(501).status(501).json({
                message: `An error occured while trying to handle the new subscriber: ${error.message}`,
                error: error,
                code: 500
            })
        }
    }
}


router.get('/', function(req, res) {
    res.status(200).json({
        message: 'Welcome to the Gevva Waitlist API!',
        code: 200
    })
})

router.get('/admin', authController.isNotLoggedIn, function(req, res, next) {
    res.redirect(`/admin/home`)
})

router.post('/api/v1/newemail', async function(req, res) {
    let refcode = req.body.refcode || req.query.refcode
    let subscriberEmail = req.body.email
    let subscriberName = req.body.name
    let plan = req.body.plan
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (subscriberName == '') {
        return res.status(401).json({
            message: 'Name cannot be empty!',
            code: 400
        })
    }
    if (!re.test(subscriberEmail)) {
        return res.status(401).json({
            message: 'Email address is not valid!',
            code: 400
        })
    }

 newMemberRegsitration(subscriberEmail,refcode, subscriberName, plan, res, null)
})

router.post('/api/v1/manual-invite', async function(req, res) {
    let {
        name,
        email,
        refcode
    } = req.body

    try {
        newMemberRegsitration(email,refcode, name, null, res, "invitation")
        let user = await connection.query('SELECT email, name, referral_count, referral_code, referred_by, verified FROM subscribers WHERE `referral_code`=(?)', [refcode])
        let referralName = 'A Gevva Admin';
        if(user.length != 0) {
           referralName = user[0].name
        }
        await connection.query('INSERT INTO invitees (email, name, referred_by) VALUES (?, ?, ?)', [email, name, referred_by])
        let mailSubject = "You have been invited to use Gevva!"
        await sendgridController.sendManualInviteEmail(email, referralName ,name, mailSubject)

        return res.status(200).json({
            code: 200
        })

    } catch (error) {
        return res.status(500).json({
            message: `An error occured while trying to update users ${error.message}`,
            code: 500
        })
    }

}),

router.get('/verify', async function(req, res) {
    let now = new Date();
    let verified_at = date.format(now, 'YYYY-MM-DD HH:mm:ss');
    let refcode = req.query.refcode

    if (refcode) {
        let user = await connection.query('SELECT email, name, referral_count, referral_code, referred_by, verified FROM subscribers WHERE `referral_code`=(?)', [refcode])
        let newUser = await connection.query(
            'SELECT * FROM (  SELECT email, referral_count, referral_code, @rownum:=@rownum + 1 as position FROM subscribers t1,' +
            '(SELECT @rownum := 0) t2 ORDER BY referral_count DESC, created_at ASC) t1 WHERE `referral_code`=(?)', [refcode])
        if (user.length !== 0) {
            let referredBy = user[0].referred_by;
            let verified = user[0].verified;
            let newUserName = user[0].name
            let newUserEmail = user[0].email
            let newUserReferralCode = user[0].referral_code
            let newUserCurrentPosition = newUser[0].position
            let newUserReferralCount = user[0].referral_count
            if (verified === "false") {
                try {
                    await connection.query('UPDATE subscribers SET `verified_at`=(?), `verified`=(?) WHERE `referral_code`=(?)', [verified_at, "true", refcode])
                    //sendgridController.successfulVerificationEmail(newUserName, newUserEmail, newUserReferralCode, newUserReferralCount, newUserCurrentPosition)
                } catch (error) {
                    return res.status(501).json({
                        message: `An error occured while trying to send mail to verified refrerral ${error.message}`,
                        code: 500
                    })
                }
                return res.status(200).json({
                    message: "You have verified your account!",
                    code: 200
                })
            } else if (verified === "true") {
                return res.status(201).json({
                    message: 'This email has already been successfully verified',
                    code: 409
                })
            }
        } else {
            return res.status(501).json({
                message: 'This refcode does not exist',
                code: 404
            })
        }
    } else {
        return res.status(400).json({
            message: `No refcode was used`,
            code: 400
        })
    }
})

router.post('/api/v1/resendVerificationEmail', async function(req, res) {
    let subscriberEmail = req.body.email;
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(subscriberEmail)) {
        return res.status(401).json({
            message: 'Email address is not valid!',
            code: 400
        })
    }
    let existingUser = await connection.query('SELECT email FROM subscribers WHERE `email`=(?)', [subscriberEmail])

    if (existingUser.length == 0) {
        return res.status(400).json({
            message: `This mail doesn't exist yet!`,
            code: 404
        })
    } else {
        try {
            let user = await connection.query('SELECT * FROM subscribers WHERE `email`=(?)', [subscriberEmail])
            let subscriberName = user[0].name
            let newUserReferralCode = user[0].referral_code
            let newUserReferralCount = user[0].referral_count

            if (user.length !== 0) {
                await sendgridController.resendVerificationEmail(subscriberEmail, subscriberName, newUserReferralCode, newUserReferralCount)
                return res.status(200).json({
                    message: "You have resent a verification mail to your account",
                    code: 200
                })
            } else {
                return res.status(401).json({
                    message: `This email doesn't exist on our platform`,
                    code: 404
                })
            }
        } catch (error) {
            return res.status(501).json({
                message: `An error occured while trying to find email ${error.message} `,
                code: 500
            })
        }
    }
})

router.post('/api/v1/invitationused', async function(req, res) {
    let timeJoined = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    let subscriberEmail = req.body.email;
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(subscriberEmail)) {
        return res.status(401).json({
            message: 'Email address is not valid!',
            code: 400
        })
    }
    try {

        let result = await connection.query('UPDATE subscribers SET invite = "used", joined = ? WHERE email= ?', [timeJoined, subscriberEmail])
        if (result.affectedRows == 0) {
            return res.status(400).json({
                message: `This user doesnt exist!`,
                code: 404
            })
        }
        if (result.affectedRows > 0) {
            return res.status(200).json({
                message: `User has successfully used their invite code!`,
                code: 200
            })
        }
    } catch (error) {
        return res.status(500).json({
            message: `An error occured while trying to update users ${error.message}`,
            code: 500
        })
    }
})


router.get('/api/v1/count/', async function(req, res) {
    try {
        let totalEmails = await connection.query('SELECT COUNT(*) AS count FROM subscribers')
        return res.status(200).json({
            emails: totalEmails[0].count,
            code: 200
        })
    } catch (error) {
        return res.status(500).json({
            message: `An error occured while trying to count emails `,
            code: 500
        })
    }
})

router.get('/api/v1/countverified/', async function(req, res) {
    try {
        let verifiedEmails = await connection.query('SELECT COUNT(*) AS count FROM subscribers WHERE `verified`="true"')
        return res.json({
            emails: verifiedEmails[0].count,
            code: 200
        })
    } catch (error) {
        return res.status(500).json({
            message: `An error occured while trying to count verified emails `,
            code: 500
        })
    }
})

router.post('/api/v1/getuserbyemail', async function(req, res) {
    console.log('ff')
    var email = req.body.email;
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(email)) {
        return res.status(200).json({
            message: 'Email address is not valid!',
            code: 400
        })
    } else {
        try {
            let user = await connection.query('SELECT name, referral_code, referral_count, referred_by, email, verified, invite FROM subscribers WHERE `email`=(?)', [email])
            if (user.length == 0) {
                return res.status(200).json({
                    message: `This email doesn't exists yet. Sign up!`,
                    code: 400
                })
            }

            let currentUser = await connection.query(
                'SELECT * FROM (  SELECT name, email, referral_count, referral_code, referred_by, @rownum:=@rownum + 1 as position FROM subscribers t1,' +
                '(SELECT @rownum := 0) t2 ORDER BY referral_count DESC, created_at ASC) t1 WHERE `email`=(?)', [email])

            if (currentUser.length !== 0) {
                user[0].position = currentUser[0].position

                let result = {
                    name: user[0].name,
                    email: user[0].email,
                    referral_count: user[0].referral_count,
                    referral_code: user[0].referral_code,
                    position: user[0].position,
                    referred_by: user[0].referred_by,
                    invite: user[0].invite,
                    verified: user[0].verified == "true" ? "Yes" : "No"
                }

                return res.status(200).json({
                    user: result,
                    code: 200
                })
            }

        } catch (error) {
            return res.status(200).json({
                message: `An error occured and user couldnt be retrieved ${error.message}`,
                code: 500
            })
        }
    }
})


router.get('/api/v1/allemails/', async function(req, res) {
    try {
        let rows = await connection.query('SELECT name, email, referral_count, referral_code, @rownum:=@rownum + 1 as rank FROM subscribers t1 ,' +
            '(SELECT @rownum := 0) t2 WHERE `dummy` = "false" ORDER BY referral_count DESC, created_at ASC')
        connection.end()
        res.status(200).json({
            users: rows,
            code: 200
        })
        /* 
            For querying all the emails on our system, And ranking them without any conditions.
          let rows = await connection.query('SELECT name, email, referral_count, referral_code, @rownum:=@rownum + 1 as rank FROM subscribers t1 ,' +
            '(SELECT @rownum := 0) t2 ORDER BY referral_count DESC, created_at ASC')
        */

    } catch (error) {
        return res.status(500).json({
            message: `An error occured and user couldnt be retrieved ${error.message}`,
            code: 500
        })
    }
});

router.get('/api/v1/top100', async function(req, res) {
    let limit = 100
    try {
        let topUsers = await connection.query('SELECT email, name FROM subscribers WHERE `referral_count` >=1 ORDER BY referral_count DESC, created_at ASC LIMIT ?', [limit])
        res.status(200).json({
            topusers: topUsers,
            code: 200
        })

    } catch (error) {
        return res.status(500).json({
            message: `An error occured and user couldnt be retrieved ${error.message}`,
            code: 500
        })
    }
});

router.get('/admin/home', authController.isLoggedIn, async function(req, res) {
    var tenDaysBack = moment().subtract(10, 'days');
    var formattedTime = tenDaysBack.format('YYYY-MM-DD');
    let now = new Date();
    let created_today = date.format(now, 'YYYY-MM-DD')
    try {
        let users = await connection.query('SELECT name, referred_by, email, referral_count, referral_code, created_at, invite, verified, @rownum:=@rownum + 1 as position FROM subscribers t1 ,' +
            '(SELECT @rownum := 0) t2 WHERE `dummy` = "false" ORDER BY referral_count DESC, created_at ASC')

        // 'SELECT * FROM (  SELECT name, email, referral_count, referral_code, referred_by, @rownum:=@rownum + 1 as position FROM subscribers t1,' +
        // '(SELECT @rownum := 0) t2 ORDER BY referral_count DESC, created_at ASC) t1 WHERE `email`=(?)', [email])
        let countLatestUsers = users.filter(user => {
            let created_at = moment(user.created_at).format('YYYY-MM-DD')
            if (created_at >= formattedTime) {
                return user
            }
        })

        let usersRegisteredToday = users.filter(user => {
            let created_at = moment(user.created_at).format('YYYY-MM-DD')
            if (created_at >= created_today) {
                return user
            }
        })

        let count = users.length

        let invitationSent = users.filter(user => {
            if (user.invite) {
                return user
            }
        })

        let invitationUsed = users.filter(user => {
            if (user.invite == "used") {
                return user
            }
        })

        let topUsers = users.filter(user => {
            if (user.referral_count >= 5) {
                return user
            }
        })

        let formattedUser = users.map(user => {
            let referral_count = user.referral_count
            let account_activity = referral_count <= 5 ? "Low" : referral_count > 5 && referral_count <= 9 ? "Moderate" : "High"
            user["account_activity"] = account_activity
            user["created_at"] = moment(user.created_at).format("YYYY-MM-DD")
            let account_activity_color = referral_count <= 5 ? "status-icon bg-danger" : referral_count > 5 && referral_count <= 9 ? "status-icon bg-warning" : "status-icon bg-success"
            user["account_activity_color"] = account_activity_color
            return user
        })


        res.render('home', {
            title: `NannyFix Admin Board`,
            users: formattedUser,
            count: count,
            countLatestUsers: countLatestUsers.length,
            todayUsers: usersRegisteredToday.length,
            priceOnUsers: Math.floor(count * 0.2),
            invitationUsed: invitationUsed.length,
            invitationSent: invitationSent.length,
            topUsers: topUsers.length
        })
    } catch (error) {
        return res.status(500).json({
            message: `An error occured and user couldnt be retrieved ${error.message}`,
            code: 500
        })
    }
});


router.get('/admin/metric', authController.isLoggedIn, async function(req, res) {
    try {

        let uniqueEntries = await connection.query('SELECT * FROM metrics')
        let usersNotOpened = [];
        let emails = [];

        uniqueEntries.map(async (user) => {
            let gravatarUrl = gravatar.url(user.email, {
                protocol: 'http',
                s: '100',
                default: 'https://www.nannyfix.com/img/awesome.png',
            });
            user['gravatarUrl'] = gravatarUrl
            return emails.push(user)
        })
        await Promise.all(emails)

        let users = await connection.query('SELECT name, email, referral_count, referral_code, created_at, invite, verified, @rownum:=@rownum + 1 as position FROM subscribers t1 ,' +
            '(SELECT @rownum := 0) t2 WHERE `dummy` = "false" ORDER BY referral_count DESC, created_at ASC')

        let invitationSent = users.filter(user => {
            if (user.invite) {
                return user
            }
        })
        let results = invitationSent.map(async (user) => {
            let metricUser = await connection.query('SELECT * FROM metrics WHERE email = ? ', [user.email])
            if (metricUser.length == 0) {
                return usersNotOpened.push(user)
            }
        })

        await Promise.all(results)

        let emailsOpened = emails.filter(email => {
            if (email.description == "open")
                return email
        })

        let welcomeEmailsOpened = emails.filter(email => {
            if (email.description == "open" && email.emailcode == "12b7ec45-c144-4885-b7f3-25cf730d0e64")
                return email
        })

        let verificationEmailsOpened = emails.filter(email => {
            if (email.description == "open" && email.emailcode == "31f51ddf-bac8-43d4-bdce-d9f3673980f7")
                return email
        })

        let inviteEmailsOpened = emails.filter(email => {
            if (email.description == "open" && email.emailcode == "29738351-e26d-4c69-8f8c-5047146ae04c")
                return email
        })
        let resentInviteEmailsOpened = emails.filter(email => {
            if (email.description == "open" && email.emailcode == "29738351-e26d-4c69-8f8c-5047146ae04c-Resent")
                return email
        })

        let resentInviteEmailsOpenedV1 = emails.filter(email => {
            if (email.description == "open" && email.emailcode == "29738351-e26d-4c69-8f8c-5047146ae04c-On-Open")
                return email
        })

        let resentInviteEmailsOpenedV2 = emails.filter(email => {
            if (email.description == "open" && email.emailcode == "29738351-e26d-4c69-8f8c-5047146ae04c-On-Unopen")
                return email
        })

        let after4DaysemailsOpened = emails.filter(email => {
            if (email.description == "open" && email.emailcode == "f7756474-e566-4a05-b41b-99290f4719f3")
                return email
        })

        let after10DaysemailsOpened = emails.filter(email => {
            if (email.description == "open" && email.emailcode == "0192ea2f-680b-4641-b1c1-5975f7c9337f")
                return email
        })

        let after14DaysemailsOpened = emails.filter(email => {
            if (email.description == "open" && email.emailcode == "9d5968bb-4ca9-4b67-becc-5e4ad1f27fa1")
                return email
        })

        let after18DaysemailsOpened = emails.filter(email => {
            if (email.description == "open" && email.emailcode == "c2421bb5-ed07-4b23-b36d-f52c984a24e8")
                return email
        })

        let afterReferring5emailsOpened = emails.filter(email => {
            if (email.description == "open" && email.emailcode == "0b65d2ef-28fb-4682-9923-a25ffc55ffae")
                return email
        })

        let emailClickSendgrid = emails.filter(email => {
            if (email.event == "click")
                return email
        })

        let emailOpenSendgrid = emails.filter(email => {
            if (email.event == "open")
                return email
        })

        let emailDeliverSendgrid = emails.filter(email => {
            if (email.event == "delivered")
                return email
        })

        let emailBounceSendgrid = emails.filter(email => {
            if (email.event == "bounce")
                return email
        })

        let emailSpamReportSendgrid = emails.filter(email => {
            if (email.event == "spamreport")
                return email
        })

        res.render('metric', {
            title: `NannyFix Admin Metric Board`,
            invitationSent: invitationSent,
            emailsOpened: emailsOpened,
            emailClickSendgrid: emailClickSendgrid,
            emailOpenSendgrid: emailOpenSendgrid,
            emailDeliverSendgrid: emailDeliverSendgrid,
            emailSpamReportSendgrid: emailSpamReportSendgrid,
            emailBounceSendgrid: emailBounceSendgrid,
            welcomeEmailsOpened: welcomeEmailsOpened,
            verificationEmailsOpened: verificationEmailsOpened,
            inviteEmailsOpened: inviteEmailsOpened,
            after4DaysemailsOpened: after4DaysemailsOpened,
            after10DaysemailsOpened: after10DaysemailsOpened,
            resentInviteEmailsOpened: resentInviteEmailsOpened,
            resentInviteEmailsOpenedV1: resentInviteEmailsOpenedV1,
            resentInviteEmailsOpenedV2: resentInviteEmailsOpenedV2,
            after14DaysemailsOpened: after14DaysemailsOpened,
            after18DaysemailsOpened: after18DaysemailsOpened,
            afterReferring5emailsOpened: afterReferring5emailsOpened,
            invitesNotOpened: usersNotOpened,
        })
    } catch (error) {
        return res.status(500).json({
            message: `An error occured and user couldnt be retrieved ${error.message}`,
            code: 500
        })
    }
});

router.post('/invite', async function(req, res) {

    let refcode = req.body.refcode
    console.log(refcode)

    let user = await connection.query('SELECT name, email, invite FROM subscribers WHERE `referral_code`=(?)', [refcode])
    let subscriberName = user[0].name
    let subscriberEmail = user[0].email
    let invitationStatus = user[0].invite

    if (!invitationStatus) {
        try {

            let mailSubject = `Your Golden Ticket Is Here`
            // await sendgridController.sendInviteEmail(subscriberEmail, subscriberName, refcode, mailSubject)
            let result = await connection.query('UPDATE subscribers SET `invite` = "invited" WHERE `referral_code`=(?)', [refcode])
            if (result.affectedRows == 0) {
                return res.status(200).json({
                    message: `This user doesnt exist!`,
                    code: 400
                })
            }
            if (result.affectedRows > 0) {
                return res.status(200).json({
                    message: `${subscriberName} has successfully been invited!`,
                    code: 200
                })
            }
        } catch (error) {
            return res.status(500).json({
                message: `An error occured while trying to update users ${error.message}`,
                code: 500
            })
        }
    } else if (invitationStatus == "used") {
        return res.json({
            message: `${subscriberName} has already been used!`,
            code: 409
        })
    } else if (invitationStatus == "invited") {
        return res.json({
            message: `${subscriberName} has already been invited`,
            code: 409
        })
    }
});


router.post('/api/v1/verify-manual-invite', async function(req, res) {
     let member = await connection.query('SELECT * FROM invitees WHERE `email`=(?)', [req.body.email])
    
     if(member.length != 0) {
        try {
            let refcode;
            let user = await connection.query('SELECT name, email, invite FROM subscribers WHERE `referral_code`=(?)', [member[0].referred_by])
            if(user.length!=0) {
                await connection.query('UPDATE subscribers SET referral_count = referral_count + 1 WHERE `referral_code`=(?)', [member[0].referred_by])
                refcode = member[0].referred_by
            }
            newMemberRegsitration(member[0].email, refcode, member[0].name, null, res, null)
        } catch (error) {
            return res.status(500).json({
                message: `An error occured while trying to create account for an invited user ${error.message}`,
                code: 500
            })
        }
     }
}),


    router.post('/reinvite', async function(req, res) {
        let refcode = req.body.refcode
        let user = await connection.query('SELECT name, email, invite FROM subscribers WHERE `referral_code`=(?)', [refcode])
        let subscriberName = user[0].name
        let subscriberEmail = user[0].email
        let invitationStatus = user[0].invite

        if (invitationStatus == "invited") {
            try {
                let mailSubject = "Missed Your Golden Ticket?"
                await sendgridController.sendInviteEmail(subscriberEmail, subscriberName, refcode, mailSubject)
                let result = await connection.query('UPDATE subscribers SET `invite` = "invited" WHERE `referral_code`=(?)', [refcode])

                if (result.affectedRows == 0) {
                    return res.status(200).json({
                        message: `This user doesnt exist!`,
                        code: 404
                    })
                }

                if (result.affectedRows > 0) {
                    return res.status(200).json({
                        message: `${subscriberName} has successfully been re-invited!`,
                        code: 200
                    })
                }
            } catch (error) {
                return res.status(500).json({
                    message: `An error occured while trying to update user ${error.message}`,
                    code: 500
                })
            }
        }
    })

router.get('/imgTracking/:imgtype/:refcode/:emailType/', async function(req, res) {
    let encodedImgUrl = req.url
    let imgArray = encodedImgUrl.split('/');
    let imgtype = imgArray[2],
        refcode = imgArray[3],
        emailType = imgArray[4],
        eventType = "Image_URL_Request",
        time = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');

    try {
        let user = await connection.query('SELECT email FROM subscribers WHERE `referral_code`=(?)', [refcode]);
        if (user.length !== 0) {
            let savedEvent = await connection.query('INSERT INTO metrics (email, event, timestamp, description, emailcode) VALUES (?, ?, ?, ?, ?)', [user[0].email, eventType, time, "open", emailType])
            // return res.redirect(`https://s3.us-east-2.amazonaws.com/nannyfix-campaign/img/pixelated-nanny-fix.png`)
            //return (imgtype == "nannyfix-logo") ? res.redirect(`https://s3.us-east-2.amazonaws.com/nannyfix-campaign/img/nanny-fix.png`) : (imgtype == "nannyfix-golden-logo") ? res.redirect(`https://s3.us-east-2.amazonaws.com/nannyfix-campaign/img/gold.png`) : res.redirect(`https://s3.us-east-2.amazonaws.com/nannyfix-campaign/img/logo.png`)
        }

        //A fallback image in case the event is not recognised.
        // res.redirect(`https://s3.us-east-2.amazonaws.com/nannyfix-campaign/img/pixelated-nanny-fix.png`)
    } catch (error) {
        return res.status(500).json({
            message: `An error occured while trying to hadle image request user ${error.message}`,
            code: 500
        })
    }
})

router.post('/sendGridWebHook', async function(req, res) {
    let events = req.body
    try {
        events.forEach(async event => {
            let userEmail = event.email;
            let eventType = event.event;
            let time = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
            let response = event.response;
            let attempts = event.attempt;

            let savedEvent = await connection.query('INSERT INTO metrics (email, event,timestamp, description, attempts) VALUES (?, ?, ?, ?, ?)', [userEmail, eventType, time, response, attempts])
        })
    } catch (error) {
        return res.status(500).json({
            message: `An error occured while trying to update user ${error.message}`,
            code: 500
        })
    }
})

router.post('/massinvite', authController.isLoggedIn, async function(req, res) {
    let from = Number.parseInt(req.body.from)
    let to = Number.parseInt(req.body.to)

    if (Number.isInteger(from) && Number.isInteger(to)) {
        if (to > from && to > 0 && from > 0) {
            let users = await connection.query('SELECT name, email, referral_count, referral_code, created_at, invite, verified, @rownum:=@rownum + 1 as rank FROM subscribers t1 ,' +
                '(SELECT @rownum := 0) t2 WHERE `dummy` = "false" ORDER BY referral_count DESC, created_at ASC')
            let state = 0;
            let uninvitedUsers = users.filter(user => {
                if (!user.invite) {
                    let rangeArray = [...range(from, to)]
                    for (let i = 0; i < rangeArray.length; i++) {
                        if (user.rank == rangeArray[i]) {
                            state += 1
                            return user, state
                        }
                    }
                }
            })

            try {
                let mailSubject = `Your Gevva Account is ready`
                for (let i = 0; i < uninvitedUsers.length; i++) {
                    await sendgridController.sendInviteEmail(uninvitedUsers[i].email, uninvitedUsers[i].name, uninvitedUsers[i].referral_code, mailSubject)
                    await connection.query('UPDATE subscribers SET `invite` = "invited" WHERE `referral_code`=(?)', [uninvitedUsers[i].referral_code])
                }
                return res.status(200).json({
                    message: `${state} People have been successfully invited!`,
                    code: 200
                })
            } catch (error) {
                return res.status(500).json({
                    message: `An error occured while trying to update users ${error.message}`,
                    code: 500
                })
            }
        } else {
            return res.status(400).json({
                message: `A correct range wasn't provided`,
                code: 400
            })
        }
    } else {
        return res.status(200).json({
            message: `The provided numbers are not numbers`,
            code: 400
        })
    }
});

router.post('/mass-invite-new-email', authController.isLoggedIn, async function(req, res) {
    let from = Number.parseInt(req.body.from)
    let to = Number.parseInt(req.body.to)

    if (Number.isInteger(from) && Number.isInteger(to)) {
        if (to > from && to > 0 && from > 0) {
            let users = await connection.query('SELECT name, email, referral_count, referral_code, created_at, invite, verified, @rownum:=@rownum + 1 as rank FROM subscribers t1 ,' +
                '(SELECT @rownum := 0) t2 WHERE `dummy` = "false" ORDER BY referral_count DESC, created_at ASC')
            let state = 0;
            let uninvitedUsers = users.filter(user => {
                if (!user.invite) {
                    let rangeArray = [...range(from, to)]
                    for (let i = 0; i < rangeArray.length; i++) {
                        if (user.rank == rangeArray[i]) {
                            state += 1
                            return user, state
                        }
                    }
                }
            })

            try {
                let mailSubject = `New mail from Nannyfix`
                let activityCode = `1ac0fb71-0b97-4e4e-a35e-5cadb737acce-Invite-UnSent`
                for (let i = 0; i < uninvitedUsers.length; i++) {
                    await sendgridController.sendInviteEmailV2({
                        subscriberEmail: uninvitedUsers[i].email,
                        subscriberName: uninvitedUsers[i].name,
                        ReferralCode: uninvitedUsers[i].referral_code,
                        subject: mailSubject,
                        trackingCode: activityCode
                    })
                    await connection.query('UPDATE subscribers SET `invite` = "invited" WHERE `referral_code`=(?)', [uninvitedUsers[i].referral_code])
                }
                return res.status(200).json({
                    message: `${state} People have been successfully invited!`,
                    code: 200
                })
            } catch (error) {
                return res.status(500).json({
                    message: `An error occured while trying to update users ${error.message}`,
                    code: 500
                })
            }
        } else {
            return res.status(200).json({
                message: `A correct range wasn't provided`,
                code: 400
            })
        }
    } else {
        return res.status(200).json({
            message: `The provided numbers are not numbers`,
            code: 400
        })
    }
})

router.post('/massreinvite', authController.isLoggedIn, async function(req, res) {
    let from = Number.parseInt(req.body.from)
    let to = Number.parseInt(req.body.to)
    let goldenTicketInviteNotOpened = []
    let goldenTicketInviteOpened = []
    let tag = req.body.tag

    if (Number.isInteger(from) && Number.isInteger(to)) {
        if (to > from && to > 0 && from > 0) {
            let users = await connection.query('SELECT name, email, referral_code, invite, @rownum:=@rownum + 1 as rank FROM subscribers t1 ,' +
                '(SELECT @rownum := 0) t2 WHERE `dummy` = "false" ORDER BY referral_count DESC, created_at ASC')
            let state = 0;
            let targetUsers = users.map(async user => {
                if (user.invite == "invited") {
                    let metricUser = await connection.query('SELECT email FROM metrics WHERE email = ? ', [user.email])
                    if (tag == "opens") {
                        if (metricUser.length > 0) {
                            let rangeArray = [...range(from, to)]
                            for (let i = 0; i < rangeArray.length; i++) {
                                if (user.rank == rangeArray[i]) {
                                    state += 1
                                    console.log("opened already", user.email)
                                    goldenTicketInviteOpened.push(user)
                                }
                            }
                        }
                    }
                    if (tag == "unopens") {
                        if (metricUser.length == 0) {
                            let rangeArray = [...range(from, to)]
                            for (let i = 0; i < rangeArray.length; i++) {
                                if (user.rank == rangeArray[i]) {
                                    state += 1
                                    console.log(user.email)
                                    goldenTicketInviteNotOpened.push(user)
                                }
                            }
                        }
                    }
                }
            })
            await Promise.all(targetUsers)

            try {
                if (tag == "opens") {
                    let mailSubject = `Your Gevva Account is ready`
                    let activityCode = `29738351-e26d-4c69-8f8c-5047146ae04c-On-Open`
                    for (let i = 0; i < goldenTicketInviteOpened.length; i++) {
                        // await sendgridController.sendReinviteEmail({
                        //     subscriberEmail: goldenTicketInviteOpened[i].email,
                        //     subscriberName: goldenTicketInviteOpened[i].name,
                        //     ReferralCode: goldenTicketInviteOpened[i].referral_code,
                        //     subject: mailSubject,
                        //     trackingCode: activityCode
                        // })
                    }
                }

                if (tag == "unopens") {
                    let mailSubject = `Your Gevva Account is ready`
                    let activityCode = `29738351-e26d-4c69-8f8c-5047146ae04c-On-Unopen`
                    for (let i = 0; i < goldenTicketInviteNotOpened.length; i++) {
                        // await sendgridController.sendReinviteEmail({
                        //     subscriberEmail: goldenTicketInviteNotOpened[i].email,
                        //     subscriberName: goldenTicketInviteNotOpened[i].name,
                        //     ReferralCode: goldenTicketInviteNotOpened[i].referral_code,
                        //     subject: mailSubject,
                        //     trackingCode: activityCode
                        // })
                    }
                }
                return res.status(200).json({
                    message: `${state} People have been successfully reinvited!`,
                    code: 200
                })
            } catch (error) {
                return res.status(500).json({
                    message: `An error occured while trying to update users ${error.message}`,
                    code: 500
                })
            }
        } else {
            return res.status(400).json({
                message: `A correct range wasn't provided`,
                code: 400
            })
        }
    } else {
        return res.status(401).json({
            message: `The provided numbers are not numbers`,
            code: 400
        })
    }
});

router.post('/checkForSpam', async function(req, res) {
    const msg = {
        to: `wecare@nannyfix.com`,
        from: `support@nannyfix.com`,
        subject: `From The Waitlist LIVE API This Mail Was Marked As Spam`,
        text: req.body,
    }
    sgMail.send(msg).then(function(msg) {
        console.log(`Sent Aggressive SPAM emails to wecare`)
    }, function(error) {
        console.log(error.message)
    });
})

module.exports = router