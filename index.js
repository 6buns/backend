const express = require('express')
const { keygen } = require('./lib/keygen')
const app = express()

var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://vide-server-default-rtdb.firebaseio.com"
});

const db = admin.database();
// var ref = db.ref("restricted_access/secret_document");
// ref.once("value", function (snapshot) {
//     console.log(snapshot.val());
// });


app.listen('8080', () => {
    console.log('Server Listening on 8080')
})

// test server for a reply
app.get('/test', (req, res, next) => {
    res.send(new Date().toLocaleString())
})

/**
 * Service Creation Data to Save,
 * plan_name,
 * plan_status,
 * plan_validity,
 * plan_particulars
    * max_active_participants,
    * max_participants,
 * api_key,
 * admin_key,
 */

// api for service creation
app.post('/service', (req, res, next) => {
    // Extract User Details form req object.
    const { uid, fullname, email, phone } = req.body.user;

    const plan_name = req.body.plan;

    // Generate a User API Key, - used for logging in rooms
    const api_key = keygen()

    // Generate a User Admin Key, - used for creating new rooms
    const admin_key = keygen()

    // Store in database.
    set(ref(db, `userkey/${uid}`), {
        api_key,
        admin_key,
        createdAt: new Date().getTime(),
    })
        .then((d) => {
            console.log(`Created and saved to db : ${JSON.stringify(d)}`, {
                api_key,
                admin_key,
            });
        })
        .catch(console.log);
})

