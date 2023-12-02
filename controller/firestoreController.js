// const express = require("express");
// const firestoreModel = require("../model/firestoreModel");
const {
  dtoUserModel,
  dtoRequestModel,
  dtoNotificationModel,
} = require("../model/firestoreModel");
const asyncHandler = require("express-async-handler");

const dtoUserController = {
  createUser: asyncHandler(async (req, res) => {
    const { data } = req.body;
    try {
      const register = await dtoUserModel.createUser({ data });
      res.status(200).json({ register });
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  }),
  getAllUsers: asyncHandler(async (req, res) => {
    const users = await dtoUserModel.getAllUsers();
    res.status(200).json({ users });
  }),
  updateUser: asyncHandler(async (req, res) => {
    const uid = req.params.uid;
    const data = req.body;
    const user = await dtoUserModel.updateUser(uid, data);
    res.status(200).json({ user });
  }),
  setAdmin: asyncHandler(async (req, res) => {
    const uid = req.params.id;
    const admin = await dtoUserModel.setAdmin(uid);
    res.status(200).json({ admin });
  }),
};

const dtoRequestController = {
  createRequest: asyncHandler(async (req, res) => {
    const { data } = req.body;
    try {
      const request = await dtoRequestModel.createRequest({ data });
      res.status(200).json({ request });
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  }),
  respondUserRequest: asyncHandler(async (req, res) => {
    const { status, data } = req.body;
    try {
      const requestId = req.params.id;
      const request = await dtoRequestModel.respondUserRequest(
        requestId,
        status,
        data
      );

      res.status(200).json({ request });
    } catch (error) {
      console.log(error);
    }
  }),
  getUserRequests: asyncHandler(async (req, res) => {
    const uid = req.params.id;
    const request = await dtoRequestModel.getUserRequests(uid);
    res.status(200).json({ request });
  }),
  getAllRequest: asyncHandler(async (req, res) => {
    const request = await dtoRequestModel.getAllRequest();
    res.status(200).json({ request });
  }),
};

const dtoNotificationController = {
  getRequestNotification: asyncHandler(async (req, res) => {
    const notification = await dtoNotificationModel.getRequestNotification();
    res.status(200).json({ notification });
  }),
  getRequisitionResponseNotification: asyncHandler(async (req, res) => {
    const uid = req.params.id;
    const notification =
      await dtoNotificationModel.getRequisitionResponseNotification(uid);
    res.status(200).json({ notification });
  }),
  updateFcmToken: asyncHandler(async (req, res) => {
    const { uid, fcmToken } = req.body;
    const fcm = await dtoNotificationModel.updateFcmToken(uid, fcmToken);
    res.status(200).json({ fcm });
  }),
  readNotification: asyncHandler(async (req, res) => {
    const notificationId = req.params.id;
    const notification = await dtoNotificationModel.readNotification(
      notificationId
    );
    res.status(200).json({ notification });
  }),
};

module.exports = {
  dtoRequestController,
  dtoUserController,
  dtoNotificationController,
};
