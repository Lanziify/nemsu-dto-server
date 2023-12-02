const asyncHandler = require("express-async-handler");
const admin = require("../config/firebase-admin-config");

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader && authorizationHeader.startsWith("Bearer")) {
    const idToken = authorizationHeader.split(" ")[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.log(error);
      res.status(401).json({ error });
    }
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

module.exports = authMiddleware;
