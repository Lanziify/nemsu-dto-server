const admin = require("../config/firebase-admin-config")
const asyncHandler = require("express-async-handler")

// firestore collection references
const db = admin.firestore()
const usersRef = db.collection("users")
const requestsRef = db.collection("requests")
const notificationRef = db.collection("notifications")

const dtoUserModel = {
  // Add user to firebase authentication
  // and creates a user document on the firestore db
  createUser: asyncHandler(async ({ data }) => {
    try {
      const user = await admin
        .auth()
        .createUser({ email: data.email, password: data.password })
      await admin.auth().updateUser(user.uid, {
        displayName: data.name,
      })

      const userData = {
        admin: false,
        uid: user.uid,
        fcmToken: "",
        name: data.name,
        position: data.position,
        office: data.office,
        email: user.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }

      await admin
        .auth()
        .setCustomUserClaims(user.uid, { admin: userData.admin })

      const userDocRef = usersRef.doc(user.uid)
      await userDocRef.set({ ...userData })
    } catch (error) {
      throw new Error(error.message)
    }
  }),
  // get all registered users
  getAllUsers: asyncHandler(async () => {
    const snapshot = await usersRef.orderBy("createdAt", "desc").get()
    const users = []

    snapshot.forEach((doc) => {
      if (doc.data().admin === false) {
        users.push(doc.data())
      }
    })

    return users
  }),
  updateUser: asyncHandler(async (uid, data) => {
    await admin.auth().updateUser(uid, {
      displayName: data.name,
    })
    return await usersRef.doc(uid).update({ ...data })
  }),
  registerAdmin: asyncHandler(async (data) => {
    try {
      const user = await admin
        .auth()
        .createUser({ email: data.email, password: data.password })
      await admin.auth().updateUser(user.uid, {
        displayName: data.name,
      })
      const userData = {
        admin: true,
        uid: user.uid,
        fcmToken: "",
        name: data.name,
        position: data.position,
        office: data.office,
        email: user.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }
      await admin
        .auth()
        .setCustomUserClaims(user.uid, { admin: userData.admin })

      const userDocRef = usersRef.doc(user.uid)
      await userDocRef.set({ ...userData })
    } catch (error) {
      throw error
    }
  }),
  // Updates user role using their uid
  setAdmin: async (uid) => {
    try {
      await admin.auth().setCustomUserClaims(uid, { admin: true })
      await usersRef.doc(uid).update({ admin: true })
    } catch (error) {
      throw new Error("Error setting admin claims: " + error.message)
    }
  },
}

const dtoRequestModel = {
  // store users' repair requisition to firestore
  // and creates a notification document using the data argument
  // then fires the notification on the admins' interface/background
  createRequest: asyncHandler(async ({ data }) => {
    const userDoc = (await usersRef.where("uid", "==", data.uid).limit(1).get())
      .docs[0]
    const adminDoc = (await usersRef.where("admin", "==", true).limit(1).get())
      .docs[0]

    const userSnapshot = userDoc.data()
    const adminSnapshot = adminDoc.data()

    const requestDocRef = requestsRef.doc()
    const notificationDocRef = notificationRef.doc()

    const request = {
      ...data,
      requestId: requestDocRef.id,
      name: userSnapshot.name,
      position: userSnapshot.position,
      office: userSnapshot.office,
      email: userSnapshot.email,
      status: "Pending",
      updatedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const notification = {
      notificationId: notificationDocRef.id,
      senderId: data.uid,
      senderName: userSnapshot.name,
      receiverId: adminSnapshot.uid,
      title: `Incoming Request`,
      body: `You've got a new repair request from ${userSnapshot.name}. Check it out now to review and respond promptly.`,
      data: { ...request },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const payload = {
      token: adminSnapshot.fcmToken,
      data: {
        title: `Incoming Request`,
        subtitle: `You've got a new repair request from ${userSnapshot.name}. Check it out now to review and respond promptly.`,
        messageId: notificationDocRef.id,
      },
    }

    await requestDocRef.set(request)
    await notificationDocRef.set(notification)
    await admin.messaging().send(payload)
  }),
  // respond to users request
  respondUserRequest: asyncHandler(async (requestId, status, data) => {
    const requestDoc = (
      await requestsRef.where("requestId", "==", requestId).get()
    ).docs[0]
    const requestSnapshot = requestDoc.data()

    const userDoc = (
      await usersRef.where("uid", "==", requestSnapshot.uid).get()
    ).docs[0]
    const userSnapshot = userDoc.data()

    const adminDoc = (await usersRef.where("admin", "==", true).limit(1).get())
      .docs[0]
    const adminSnapshot = adminDoc.data()

    const notificationDocRef = notificationRef.doc()

    let notificationTitle = ""
    let notificationMessage = ""

    if (status == "Accepted") {
      notificationTitle = "Request Accepted!"
      notificationMessage = `Your request #${requestId} has been approved and is now being processed. We're working on fulfilling it. Thank you for your patience.`
    } else if (status == "Completed") {
      notificationTitle = "Request Completed!"
      notificationMessage = `We're pleased to inform you that your request #${requestId} has been processed and fulfilled. Let us know if you have any feedback!`
    } else if (status == "Canceled") {
      notificationTitle = "Request Canceled"
      notificationMessage = `We're sorry to inform you that your requisition request #${requestId} has been canceled.  If you have any concerns, feel free to reach out to us.`
    }

    const notification = {
      notificationId: notificationDocRef.id,
      senderId: adminSnapshot.uid,
      senderName: adminSnapshot.name,
      receiverId: userSnapshot.uid,
      title: notificationTitle,
      body: notificationMessage,
      // data: { ...data },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const payload = {
      token: userSnapshot.fcmToken,
      data: {
        title: notificationTitle,
        subtitle: notificationMessage,
        messageId: notificationDocRef.id,
      },
    }

    if (status == "Accepted" || status == "Canceled") {
      await requestsRef.doc(requestId).update({
        status: status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      await notificationDocRef.set(notification)
      await admin.messaging().send(payload)
    }

    if (status == "Completed") {
      await requestsRef.doc(requestId).update({
        status: status,
        ...data,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      await notificationDocRef.set(notification)
      await admin.messaging().send(payload)
    }
  }),
  // get request made by the user using users' uid
  getUserRequests: asyncHandler(async (uid) => {
    try {
      const snapshot = await requestsRef
        .where("uid", "==", uid)
        .orderBy("createdAt", "desc")
        .get()

      const requests = []
      snapshot.forEach((doc) => {
        requests.push(doc.data())
      })
      return requests
    } catch (error) {
      throw new Error(error)
    }
  }),
  // get All request made by users
  getAllRequest: asyncHandler(async () => {
    const snapshot = await requestsRef.get()
    const requests = []

    snapshot.forEach((doc) => {
      requests.push(doc.data())
    })

    return requests
  }),
}

const dtoNotificationModel = {
  // get all request notifications made by users
  getRequestNotification: asyncHandler(async () => {
    const snapshot = await notificationRef.get()

    const notification = []
    snapshot.forEach((doc) => {
      notification.push(doc.data())
    })

    return notification
  }),

  getRequisitionResponseNotification: asyncHandler(async (uid) => {
    const snapshot = await notificationRef.where("receiverId", "==", uid).get()

    const notification = []
    snapshot.forEach((doc) => {
      notification.push(doc.data())
    })

    return notification
  }),
  // update firebase cloud messaging token
  updateFcmToken: asyncHandler(async (uid, fcmToken) => {
    return usersRef.doc(uid).update({ fcmToken: fcmToken })
  }),
  readNotification: asyncHandler(async (notificationId) => {
    return notificationRef.doc(notificationId).update({ read: true })
  }),
}

module.exports = {
  dtoUserModel,
  dtoRequestModel,
  dtoNotificationModel,
}
