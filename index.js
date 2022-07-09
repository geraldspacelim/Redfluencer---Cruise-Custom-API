require("dotenv").config();
const express = require("express");
// const Firestore = require("@google-cloud/firestore");
const fs = require("firebase-admin");
const serviceAccount = require("./firebase.json");
const { v4: uuidv4 } = require("uuid");
const { check, validationResult } = require("express-validator");
const helper = require("./helper.js");
const api = require("./api");
const axios = require("axios").default;

fs.initializeApp({
  credential: fs.credential.cert(serviceAccount),
});

const db = fs.firestore();
const app = express();
app.use(express.json());
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`RWS x Redfluencer custom api listening on port ${port}`);
});

app.get("/", async (req, res) => {
  res.json({ status: "this is testing" });
});

app.get("/promo/:promoCode", async (req, res) => {
  const promoCode = req.params.promoCode;
  const query = db.collection("promoCodes").where("promoCode", "==", promoCode);
  const querySnapshot = await query.get();
  if (querySnapshot.size > 0) {
    res.status(200).json(querySnapshot.docs[0].data());
  } else {
    res.status(404).json({ response: "Invalid Promo Code" });
  }
});

app.post(
  "/test",
  [
    check("promoCode").not().isEmpty().withMessage("Promo Code is required"),
    check("grossAmount")
      .not()
      .isEmpty()
      .withMessage("Gross Amount is required")
      .isFloat()
      .withMessage("Gross Amount must be of type Float"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const custErrMsg = helper.createCustomError(errors);
      return res.status(400).json({
        success: false,
        errors: custErrMsg,
      });
    }

    const { promoCode, grossAmount } = req.body;
    const commissionUuid = uuidv4();
    const merchantUuid = process.env.MERCHANT_UUID;

    const promoQuery = db
      .collection("PromoCodes")
      .where("promoCode", "==", promoCode);
    const merchantQuery = db.collection("Shops").doc(merchantUuid);

    try {
      const [promoQuerySnapshot, merQuerySnapshot] = await Promise.all([
        await promoQuery.get(),
        await merchantQuery.get(),
      ]);

      if (promoQuerySnapshot.size === 0) {
        throw new Error("Promo Code is invalid");
      }

      const influencerUuid = promoQuerySnapshot.docs[0].id;
      const merchantDetails = merQuerySnapshot.data();

      const commissionData = helper.calculateCommission(
        merchantDetails,
        grossAmount
      );

      const merchantData = {
        [commissionUuid]: {
          influencerUUID: influencerUuid,
          merchantUUID: merchantUuid,
          transactionDetails: {
            commissionData,
          },
        },
      };

      const { dateCreated, influencerCommission, productOriginalPrice } =
        commissionData;
      const { companyName } = merchantDetails;

      const userData = {
        [commissionUuid]: {
          dateCreated: dateCreated,
          influencerCommission: influencerCommission,
          shopUUID: merchantUuid,
          uuid: influencerUuid,
        },
      };

      const merNotiticationData = {
        [commissionUuid]: {
          body: `A purchase of  $${productOriginalPrice} was made at ${companyName}`,
          dateCreated: dateCreated,
          title: "Expense",
          transactionUUID: commissionUuid,
        },
      };

      const infNotificationData = {
        ...merNotiticationData,
        title: "Rewards",
        body: `You received $${influencerCommission} from a puchase at ${companyName}`,
      };

      // await Promise.all([
      //   await db.collection("Users").doc(influencerUuid).update({
      //     commissions: userData,
      //   }),
      //   await db.collection("Shops").doc(merchantUuid).update({
      //     commissions: merchantData,
      //   }),
      //   await db
      //     .collection("Notifications")
      //     .doc(merchantUuid)
      //     .set(merNotiticationData),
      //   await db
      //     .collection("Notifications")
      //     .doc(influencerUuid)
      //     .set(infNotificationData),
      // ]);

      const influencerDetails = await db
        .collection("Users")
        .doc(influencerUuid)
        .get();
      const { deviceToken } = influencerDetails.data();
      if (deviceToken.length > 0) {
        deviceToken.forEach(async (token) => {
          const payloadDetails = {
            title: "Rewards",
            body: `You received $${influencerCommission.toFixed(
              2
            )} in commissions from a purchase at ${companyName}`,
            token: token,
          };
          const payload = helper.createFCMPayload(payloadDetails);
          const headers = {
            "Content-Type": "application/json,text/plain, */*",
            Authorization: `key=${process.env.SERVER_KEY}`,
          };
          try {
            // await api.fcm({ url: "fcm", method: "POST", data: payload });
            axios.post("https://fcm.googleapis.com/fcm", payload, { headers });
          } catch (err) {
            return res.status(400).json({
              success: false,
              message: err.message,
            });
          }
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Transaction successful",
    });
  }
);
