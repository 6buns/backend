const express = require("express");
const { keygen, keyVerify } = require("./lib/keygen");
const app = express();
const crypto = require('crypto');
const jose = require('jose');

const db = new Firestore({
    projectId: 'vide-336112',
});

const { Firestore } = require('@google-cloud/firestore');
const stripe = require('stripe')('sk_test_51KNlK1SCiwhjjSk0Wh83gIWl21JdXWfH9Gs9NjQr4sos7VTNRocKbvipbqO0LfpnB6NvattHJwLJaajmxNbyAKT900X1bNAggO');

app.listen("80", () => {
    console.log("Server Listening on 80");
});

app.use(express.json());

exports.saveStat = async (req, res) => {
    switch (req.method) {
        case 'POST': {
            const { roomStat } = req.body;

            db.collection('stats').add({
                ...roomStat
            }).then(() => {
                res.sendStatus(200)
            }).catch(() => {
                res.sendStatus(500)
            });

            break;
        }
        default: {
            res.sendStatus(400)
        }
    }
}

// exports.newUserSignup = (event) => {
//     try {
//         if (event.email && event.uid) {
//             // Extract User Details form req object.
//             const { uid, displayName, phone, email, photoURL } = event;

//             // // Generate a User API Key, - used for logging in rooms
//             const apiKey = keygen();
//             const apiKeyHash = crypto.createHash('md5').update(apiKey).digest('hex');

//             // // Store in database.
//             await db.collection('keyStore').doc(apiKeyHash)
//                 .set({
//                     uid: uid,
//                     type: "account",
//                     createdAt: Date.now(),
//                 });

//             // const customer = await stripe.customers.create({
//             //     name: displayName,
//             //     email: email,
//             // });

//             await db.collection('users').doc(uid).set({
//                 uid,
//                 displayName,
//                 phone,
//                 email,
//                 photoURL,
//                 stripe: customer.id,
//                 services: [],
//             })

//             res.status(200).json({
//                 api_key: apiKey,
//                 customer: customer
//             })
//         }
//     } catch (error) {
//         res.status(500).json(error)
//     }
// }

// exports.service = (req, res) => {
//     switch (req.method) {
//         case 'GET': {
//             const { apiKey } = req.body;
//             const apiKeyHash = crypto.createHash('md5').update(apiKey).digest('hex');
//             db.collection('keyStore').doc(apiKeyHash).get().then(doc => {
//                 if (doc.exists) {
//                     res.status(200).json(doc.data())
//                 } else {
//                     res.sendStatus(404)
//                 }
//             }).catch(e => {
//                 res.status(500)
//             });
//             break;
//         }
//         case 'DELETE': {
//             const { apiKeyHash } = req.body
//             db.collection('keyStore').doc(apiKeyHash).delete().then(e => {
//                 res.status(200).json(e)
//             }).catch(err => {
//                 res.status(500).json(err)
//             })
//             break;
//         }
//         default: {
//             res.status(405).send({ error: 'Something blew up!' });
//             break;
//         }
//     }
// };


// exports.webhookStripe = async (req, res) => {
//     // Retrieve the event by verifying the signature using the raw body and secret.
//     let event;

//     try {
//         event = stripe.webhooks.constructEvent(
//             req.body,
//             req.headers['stripe-signature'],
//             process.env.STRIPE_WEBHOOK_SECRET
//         );
//     } catch (err) {
//         console.log(err);
//         console.log(`⚠️  Webhook signature verification failed.`);
//         console.log(
//             `⚠️  Check the env file and enter the correct webhook secret.`
//         );
//         return res.sendStatus(400);
//     }

//     // Extract the object from the event.
//     const dataObject = event.data.object;

//     // Handle the event
//     // Review important events for Billing webhooks
//     // https://stripe.com/docs/billing/webhooks
//     // Remove comment to see the various objects sent for this sample
//     switch (event.type) {
//         case 'customer.created': {
//             // Create service api keys, for
//             // newly created customer
//             break;
//         }
//         case 'customer.deleted': {
//             // Remove Service api Keys,
//             // send consolation and survey email.
//             break;
//         }
//         case 'invoice.paid': {
//             // Update the active till and from
//             // of service api key attached to this subscription
//             // whose invoice is paid.
//             break;
//         }
//         case 'customer.subscription.deleted': {
//             db.collection('keyStore').where('sid', '==', dataObject.id).delete().then(e => {
//                 res.status(200).json(e)
//             }).catch(e => {
//                 res.sendStatus(500)
//             })
//             break;
//         }
//         case 'customer.subscription.updated':
//             if (dataObject.status === 'active') {
//                 const customer_id = dataObject.customer
//                 const user = await db.collection('users').where('stripe', '==', customer_id).get();

//                 // Generate a User API Key, - used for logging in rooms
//                 const apiKey = keygen();
//                 const apiKeyHash = crypto.createHash('md5').update(apiKey).digest('hex');

//                 // // Store in database.
//                 db.collection('keyStore').doc(apiKeyHash)
//                     .set({
//                         uid: user.uid,
//                         sid: dataObject.id,
//                         type: 'service',
//                         plan: "Small",
//                         consumersLimit: 96,
//                         usageCost: 0.005,
//                         fixedCharge: 3,
//                         activeFrom: Date.now(),
//                         activeTill: Date.now() + (7 * 24 * 60 * 60 * 1000),
//                         createdAt: Date.now(),
//                         lastUpdateAt: Date.now(),
//                     })
//                     .then((data) => {
//                         res.status(200).json(data);
//                     })
//                     .catch((err) =>
//                         res.json(err).status(400)
//                     );
//             }
//             break;
//         default:
//         // Unexpected event type
//     }
//     res.sendStatus(200);
// }
