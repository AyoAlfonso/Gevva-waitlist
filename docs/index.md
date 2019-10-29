

# NannyWaitlist API

Collection/Table Name: **subscribers**
Collection Schema:
```js
  CREATE TABLE `subscribers` (
  `idsubscribers` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(45) NOT NULL,
  `referral_code` varchar(45) NOT NULL,
  `name` varchar(45) NOT NULL,
  `referral_count` int(11) DEFAULT '0',
  `verified_at` datetime DEFAULT NULL,
  `referred_by` varchar(45) DEFAULT NULL,
  `verified` varchar(45) DEFAULT 'false',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dummy` varchar(45) DEFAULT 'false',
  PRIMARY KEY (`idsubscribers`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  UNIQUE KEY `referral_code_UNIQUE` (`referral_code`)
) ENGINE=InnoDB AUTO_INCREMENT=3368 DEFAULT CHARSET=latin1
```
| Endpoint                        	| HTTP Method 	| Resources                     	| Result                                                                                                                                                                                                                                                                                                                                              	| Description                                                                                                                   	|
|---------------------------------	|------------:	|-------------------------------	|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------	|-------------------------------------------------------------------------------------------------------------------------------	|
| /api/v1/newemail                	| POST        	| Body: refcode, email and name 	| An array called `newUser` where the user's info (name, email, referral_count, referral_code, position) is wrapped in an object.                                                                                                                                                                                                                                                                                	| Creates a new user with a unique referral code, returns new position, referral count(which will of course be zero) etc.       	|
| /verify                         	| GET         	| Query: refcode                	| { message: "You have verified your account!", code: 200 }                                                                                                                                                                                                                                                                                           	| This will verify the owner of the email sent into the body of a post request to the API.                                      	|
| /api/v1/resendVerificationEmail 	| POST        	| Body: email                   	| { message: "You have resent a verification mail to your account", code: 200 }                                                                                                                                                                                                                                                                       	| This will resend the verification link and send to the owner of the email sent in the body of a post request to the API.      	|
| /api/v1/count                   	| GET         	| none                          	| { emails: 1222, code: 200 }                                                                                                                                                                                                                                                                                                                         	|                                                                                                                               	|
| /api/v1/countverified           	| GET         	| none                          	| { emails: 122, code: 200 }                                                                                                                                                                                                                                                                                                                          	|                                                                                                                               	|
| /api/v1/getuserbyemail          	| POST        	| Body: email                   	| An array `user` enclosing the details of the user in an object. Usage: To get the name of the user for example use:  user[0].name   {   user:    [{   name: "Joshua Abodunrin",    referral_code: "332UNSHYW",    referral_count: 2, referred_by: null ,   email: "alfonsoayo7@gmail.com",   verified: "true",   position: 2025 }],     code: 200 } 	| This will show all the users information by sending an email in the body of a post request to the API.                        	|
| /api/v1/top100                  	| GET         	| none                          	| An array of objects `topUsers` enclosing the details; name and email of each user in objects.  Usage: To get the first user topUsers[0].name To get the third user topUsers[2].name                                                                                                                                                                 	| Note: Will only show users email and name. And currently is showing only 100 users.                                           	|
| /api/v1/allemails               	| GET         	| none                          	| An array of objects called `emails`.  Each user object has the full information of the user: name, email, referral_count and referral_code   Usage: To get the first user email[0].nameTo get the fourth user email[3].name                                                                                                                         	| Note: Will only show users that have been verified and have at least a referral count.                                        	|



**1. Add new subscriber to the Waitlist DB:**

 A **POST**  request to : **URL**/api/v1/newemail?refcode=8282828
Where `URL` is current base website address. 
Where the `refcode` (optional) is refcode of the user who referred this new user. If this new user doesn't have a referrerI(as in a third party who directed them to nannyfix through his or her link then, no referral code will be needed. Can be passed as query parameter or passed in the body of the request. 

In the body of this request the  `email` and `name` of this new subscriber have to be passed to the api. 

**What Happens:**
 - API generates a `new refcode` (combination of alphabets and strings). The new user is now then created with  a unique email, refcode and name to follow. 
 - API gets  the position of the new user. 
 - API sends a verification mail to the new subscriber including these info:
 *User ReferralCode*,
 *User Current Position*,
  *User Referral Count* 

After this has been verified we add a point to the referrer (if there was at all) using the refcode above(i.e 8282828 )
 
  
**2. Verify a New Subscriber**
A **GET** request to:  **URL**/api/v1/verify?refcode=929292

Where the refcode is of the new susbcriber has to be passed as a `query parameter`. Nothing needs to be passed into the request body. 
  
**What Happens:**
 - API uses  refcode to find user on our DB
 - Changes status of user to `verified` 
 -  API sends verification email to user. 
  
**3. To Check Total Number of ALL Email Entries (verified & Unverfied)**
A **GET** request to: **URL**/api/v1/count/

You **DO NOT** need to send anything to this route.

 - Possible Success message: A JSON response holding the total number of emails in the system. 
 - Possible Error message: An error occured while trying to count emails


**4.	 To Check Total Number of Verfied Email Entries**
A **GET** request to: **URL**/api/v1/countverified/

Same as the above. A `JSON` response hodlding the number of  verified people in the DB.

**5. To Get User Info by email**
A **POST**  request to: **URL**/api/v1/getuserbyemail
You send an email to the body of this route. 

**What Happens:**
-   API validates email and then passes it to the db query
-   We find a user and rerturn `user` details including `current user position`

To handle the user JSON response :
```js
user[0].referred_by;
user[0].verified;
user[0].name
user[0].email
user[0].referral_code
user[0].position
user[0].referral_count
```
  
**6. To Resend Verification Mail to Subscriber**

A **GET** request to: **URL**/v1/resendVerificationEmail

You need to pass the user's `email` into the body of the request 

 - Possible Success message: `You have resent a verification mail to your account` . Where the link containing the refcode is sent to this user.
 
 If the email doesnt exist on our DB.  A json 401 error is returned with message: `This email doesn't exist on our platform`

Or else every other error is a server side error with a 501 code. 

**7. To Get The Top 100**
A **GET** request to: **URL**/api/v1/top100

You need not send anything to this route. The limit as already been set to 100.

 - Possible Success message: A JSON response holding the list of top 100  user information will be sent to the request.
 
 - Error message: An error occured while trying to process supplied `email`

JSON Response(Array of objects):
```js
[
  {
  "email":  "alfonsoayos7@gmail.com",
  "name":  ""
  },
  {
    "email":  "alfonsoaydos7@gmail.com",
  "name":  "ayo tes1"
  }
]
```

**8. To Get All Emails And Ranking**
**GET** *URL** api/v1/api/v1/allemails

You **need not** send anything to this route. The limit as already been set to unlimited

 - Possible Success message: A JSON respnse holding the list of all user (email, name, referral count, referal_code and rank) will be sent to user
 - Error message: An error occured while trying to get use with supplied `email`

JSON Response:

```js

[
  {
  "email":  "Dazzriht@gmail.com",
  "referral_count":  4,
  "referral_code":  "82302i3",
  "rank":  1
  },
  {
  "email":  "Nkantisele@gmail.com",
  "referral_count":  3,
  "referral_code":  "93993",
  "rank":  2
  },
  {
  "email":  "Cardinal@gmail.com",
  "referral_count":  2,
  "referral_code":  "33333",
  "rank":  3
  },
  {
  "email":  "alfonso7@gmail.com",
  "referral_count":  0,
  "referral_code":  "2882828",
  "rank":  4
  },
  {
  "email":  "alfoins@gmail.com",
  "referral_count":  0,
  "referral_code":  "",
  "rank":  5
  },
  {
  "email":  "alfonsoayo7@gmail.com",
  "referral_count":  0,
  "referral_code":  "PKERK57BS",
  "rank":  6
  },
  {
  "email":  "alfonsoayos7@gmail.com",
  "referral_count":  0,
  "referral_code":  "P3VRYXHMA",
  "rank":  7
  },
  {
  "email":  "alfonsoaydos7@gmail.com",
  "referral_count":  0,
  "referral_code":  "P3KCAX7BA",
  "rank":  8
  },
  {
  "email":  "Dazzrihddt@gmail.com",
  "referral_count":  0,
  "referral_code":  "P3Z4QH7BS",
  "rank":  9
  },
  {
  "email":  "test2@gmail.com",
  "referral_count":  0,
  "referral_code":  "FKSHPHHMS",
  "rank":  10
  },
  {
  "email":  "test3@gmail.com",
  "referral_count":  0,
  "referral_code":  "FKUD6H7MS",
  "rank":  11
  },
  {
  "email":  "test4@gmail.com",
  "referral_count":  0,
  "referral_code":  "PKCDMH7BS",
  "rank":  12
  }
]
```
