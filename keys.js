require('dotenv').config();

exports.sendgrid = {
    API_KEY: process.env.SENDGRID_API_KEY,
    LIST_ID: prcocess.env.WAITLIST_ID 
};

exports.config = {
    "API_URL": process.env.API_URL,
    "SITE_URL": process.env.SITE_URL,
    "mainCsv": process.env.ACTIVE_WAITLIST || process.env.LIVE_ACTIVE_WAITLIST,

    /* To tell the difference between the demo and live env varibles, look out for the key words "demo" and live in our secret key file*/
    "dropText3": process.env.DROP_TEXT3 || process.env.LIVE_DROP_TEXT3,
    "dropText4":  process.env.DROP_TEXT4 || process.env.LIVE_DROP_TEXT4,
    "dropText5":  process.env.DROP_TEXT5 || process.env.LIVE_DROP_TEXT5,
    "dropText6":  process.env.DROP_TEXT6 || process.env.LIVE_DROP_TEXT6,

    "waitingList": process.env.ACTIVE_WAITLIST_FSIMPL || process.env.LIVE_ACTIVE_WAITLIST_FSIMPL,
    "emails_dripjob3": process.env.DROP_JOB_3 || process.env.LIVE_DROP_JOB_3,
    "emails_dripjob4": process.env.DROP_JOB_4 || process.env.LIVE_DROP_JOB_4,
    "emails_dripjob5": process.env.DROP_JOB_5 || process.env.LIVE_DROP_JOB_5,
    "emails_dripjob6": process.env.DROP_JOB_6 || process.env.LIVE_DROP_JOB_6
};