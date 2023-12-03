const express = require("express")
const router = express.Router()
const authMiddleware = require("../middleware/validateTokenHandler")
const {
  dtoUserController,
  dtoRequestController,
  dtoNotificationController,
} = require("../controller/firestoreController")

// Users
router.route("/register").post(authMiddleware, dtoUserController.createUser)
router.route("/users").get(dtoUserController.getAllUsers)
router.route("/update/user/:uid").put(dtoUserController.updateUser)
router.route("/admin/:id").put(dtoUserController.setAdmin)

// Requests
router.route("/create").post(authMiddleware, dtoRequestController.createRequest)

// Requests (admin)
router.route("/requests").get(dtoRequestController.getAllRequest)
router.route("/request/:id").put(dtoRequestController.respondUserRequest)
// Requests (user)
router.route("/user/requests/:id").get(dtoRequestController.getUserRequests)

// Notifications
router.route("/fcm").put(dtoNotificationController.updateFcmToken)
router
  .route("/notification/request")
  .get(dtoNotificationController.getRequestNotification)
router
  .route("/notification/:id")
  .get(dtoNotificationController.getRequisitionResponseNotification)
router
  .route("/notification/:id")
  .put(dtoNotificationController.readNotification)

module.exports = router
