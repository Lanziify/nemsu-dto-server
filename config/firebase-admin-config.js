const admin = require("firebase-admin");
const serviceAccount = require("../nemsu-dto-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
