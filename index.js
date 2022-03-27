const express = require("express");
// const { keygen, keyVerify } = require("./lib/keygen");
const app = express();
const crypto = require('crypto');
const Buffer = require('buffer')
// const jose = require('jose');
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');
const { removeRoom } = require("./lib/redis");
const jsonfile = require('jsonfile')

require('dotenv').config();

const storage = new Storage();
const db = new Firestore({
    projectId: 'vide-336112',
});

const stripe = require('stripe')(process.env.STRIPE_WEBHOOK_KEY);

app.listen("80", () => {
    console.log("Server Listening on 80");
});

app.use(express.json());

// exports.saveStat = async (req, res) => {
//     switch (req.method) {
//         case 'POST': {
//             const { roomStat } = req.body;

//             const roomStatDecoded = Buffer.from(roomStat, 'base64').toJSON()

//             db.collection('stats').add({
//                 ...roomStatDecoded
//             }).then(() => {
//                 res.sendStatus(200)
//             }).catch(() => {
//                 res.sendStatus(500)
//             });

//             break;
//         }
//         default: {
//             res.sendStatus(400)
//         }
//     }
// }

// exports.cleanRoomSession = async (req, res) => {
//     switch (req.method) {
//         case 'POST': {
//             const { id, apikey } = req.body;
//             apikey = apikey ? apikey : '999444555666';
//             let uid = 'usr_999444555666', stripeId = 'cus_L61f4eFl5pew3W';

//             const apiKeyHash = crypto.createHash('md5').update(apiKey).digest('hex');

//             db.collection('keyStore').doc(apiKeyHash).get().then(doc => {
//                 ({ uid, stripeId } = doc.data())
//             }).catch(error => res.status(500).json({ error }))

//             // Check Room Data in Redis,
//             // delete from redis if present.
//             await removeRoom(id)

//             // Get Stats Data from firestore
//             const statSnapshot = await db.collection('stats').where('name', '==', id).get()

//             if (statSnapshot.empty) {
//                 res.sendStatus(404)
//             }

//             const roomDataJson = {};
//             roomDataJson['name'] = id;
//             const consumers = {};
//             const timestamps = [];

//             statSnapshot.docs.forEach(doc => {
//                 const stat = doc.data()
//                 roomDataJson[doc.id] = stat
//                 let consumerCount = [];

//                 timestamps.push(stat.timestamp)

//                 stat.peers.forEach(peer => {
//                     consumerCount.push(peer.consumers.length)
//                 })

//                 consumers[stat.routerId] = consumerCount.reduce((x, y) => x > y ? x : y)
//             })

//             const consumerCount = Object.values(consumers).reduce((x, y) => x + y)
//             const startAt = timestamps.sort((x, y) => x < y ? x : y)
//             const endAt = timestamps.sort((x, y) => x > y ? x : y)

//             const durationInMin = Math.ceil(Math.ceil((endAt - startAt) / 1000) / 60)

//             const usageQuantity = Math.ceil(durationInMin * consumerCount)

//             roomDataJson['startAt'] = startAt
//             roomDataJson['endAt'] = endAt
//             roomDataJson['consumerCount'] = consumerCount
//             roomDataJson['durationInMin'] = durationInMin

//             const fileName = `${id}.json`
//             const filePath = `/tmp/${fileName}`

//             const subscriptionItemID = 'sub_1KUrSjSCiwhjjSk0LEQnA4Uz';
//             const idempotencyKey = crypto.randomUUID();

//             // Add Usage Data to Stripe Customer Subscription
//             try {
//                 await stripe.subscriptionItems.createUsageRecord(
//                     subscriptionItemID,
//                     {
//                         quantity: usageQuantity,
//                         timestamp: endAt,
//                         action: 'increment',
//                     },
//                     {
//                         idempotencyKey,
//                     }
//                 );

//                 roomDataJson['billGenerated'] = true
//             } catch (error) {
//                 roomDataJson['billGenerated'] = false
//                 roomDataJson['billDetails'] = {
//                     subscriptionItemID,
//                     idempotencyKey
//                 }
//                 console.error(`Usage report failed for item ID ${subscriptionItemID} with idempotency key ${idempotencyKey}: ${error.toString()}`);
//             }

//             // Create a JSON File, and upload to Cloud Storage Bucket
//             jsonfile.writeFile(filePath, obj)
//                 .then(async (res) => {
//                     // upload to cloud storage
//                     await storage.bucket(uid).upload(filePath, {
//                         destination: fileName,
//                     });
//                 })
//                 .catch(error => res.status(500).json({ error }))

//             // Delete Stats from Stat db.
//             const batch = db.batch();
//             statSnapshot.docs.forEach((doc) => {
//                 batch.delete(doc.ref);
//             });
//             await batch.commit();

//             break;
//         }
//         default:
//             res.sendStatus(404)
//             break;
//     }
// }

exports.newUserSignup = async (event) => {
    try {
        if (event.email && event.uid) {
            // Extract User Details form req object.
            const { uid, displayName, phone, email, photoURL } = event.value;

            try {
                const customer = await stripe.customers.create({
                    name: displayName,
                    email: email,
                });

                res.status(200).json({
                    customer: customer
                })
            } catch (error) {
                res.status(500).json(error)
            }
        }
    } catch (error) {
        res.status(500).json(error)
    }
}

exports.webhookStripe = async (req, res) => {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            req.headers['stripe-signature'],
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.log(err);
        console.log(`⚠️  Webhook signature verification failed.`);
        console.log(
            `⚠️  Check the env file and enter the correct webhook secret.`
        );
        return res.sendStatus(400);
    }

    // Extract the object from the event.
    const dataObject = event.data.object;

    // Handle the event
    // Review important events for Billing webhooks
    // https://stripe.com/docs/billing/webhooks
    // Remove comment to see the various objects sent for this sample
    switch (event.type) {
        case 'customer.created': {
            // Send Email to customer,

            break;
        }
        case 'invoice.paid': {
            const customer_id = dataObject.customer
            const prev = await db.collection('keyStore').where('stripe_id', '==', customer_id).get()
            if (!prev.exists) {
                console.log(`No Key exists, for this payment.`)
            } else {
                const data = prev.data()
                if (!data.active) {
                    await db.collection('keyStore').where('stripe_id', '==', customer_id).update({
                        active: true,
                    })
                }
            }
            break;
        }
        case 'invoice.payment_action_required': {
            const customer_id = dataObject.customer
            const prev = await db.collection('keyStore').where('stripe_id', '==', customer_id).get()
            if (!prev.exists) {
                console.log(`No Key exists, for this payment.`)
            } else {
                const data = prev.data()
                if (data.active) {
                    await db.collection('keyStore').where('stripe_id', '==', customer_id).update({
                        active: false,
                    })
                }
            }
            break;
        }
        case 'invoice.payment_failed': {
            const customer_id = dataObject.customer
            const prev = await db.collection('keyStore').where('stripe_id', '==', customer_id).get()
            if (!prev.exists) {
                console.log(`No Key exists, for this payment.`)
            } else {
                const data = prev.data()
                if (data.active) {
                    await db.collection('keyStore').where('stripe_id', '==', customer_id).update({
                        active: false,
                    })
                }
            }
            break;
        }
        case 'customer.subscription.created': {
            if (dataObject.status === 'active') {
                const customer_id = dataObject.customer
                const user = await db.collection('users').where('stripe_id', '==', customer_id).get();

                // Generate a User API Key, - used for logging in rooms
                const apiKey = crypto.randomBytes(99).toString('hex')
                const apiKeyHash = crypto.createHash('md5').update(apiKey).digest('hex');

                // // Store in database.
                db.collection('keyStore').doc(apiKeyHash)
                    .set({
                        user_id: user.uid,
                        stripe_id: dataObject.customer,
                        api_key: apiKey,
                        active: true
                    })
                    .then((data) => {
                        res.status(200).json(data);
                    })
                    .catch((err) =>
                        res.json(err).status(400)
                    );
            }
            break;
        }
        case 'customer.subscription.deleted': {
            db.collection('keyStore').where('stripe_id', '==', dataObject.customer).delete().then(e => {
                res.status(200).json(e)
            }).catch(e => {
                res.sendStatus(500)
            })
            break;
        }
        case 'customer.subscription.updated':
            // Billing period started or ended
            break;
        default:
        // Unexpected event type
    }
    res.sendStatus(200);
}
