jest.mock("../db_queries/user-validation", () => jest.fn());
jest.mock("../db_queries/user-db", () => ({
  addUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  getAllUser: jest.fn(),
  getByUnityId: jest.fn(),
  getByID: jest.fn()
}));

const express = require("express");
const request = require("supertest");
const validateUser = require("../db_queries/user-validation");
const userDb = require("../db_queries/user-db");
const userRouter = require("../rest_api/userAPI");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/users", userRouter);
  return app;
}

describe("userAPI", () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.clearAllMocks();
  });

  test("GET /users returns all users when no query params are provided", async () => {
    const fakeUsers = [
      { userID: 1, unityID: "abc123", questionPriv: 1, userPriv: 0 }
    ];
    userDb.getAllUser.mockResolvedValue(fakeUsers);

    const res = await request(app).get("/users");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeUsers);
    expect(userDb.getAllUser).toHaveBeenCalledTimes(1);
    expect(userDb.getByID).not.toHaveBeenCalled();
    expect(userDb.getByUnityId).not.toHaveBeenCalled();
  });

  test("GET /users?id=... queries by ID", async () => {
    const fakeUser = [{ userID: 7, unityID: "bob1" }];
    userDb.getByID.mockResolvedValue(fakeUser);

    const res = await request(app).get("/users?id=7");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeUser);
    expect(userDb.getByID).toHaveBeenCalledWith("7");
    expect(userDb.getAllUser).not.toHaveBeenCalled();
  });

  test("GET /users?unityId=... queries by unityId", async () => {
    const fakeUser = [{ userID: 8, unityID: "abc123" }];
    userDb.getByUnityId.mockResolvedValue(fakeUser);

    const res = await request(app).get("/users?unityId=abc123");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeUser);
    expect(userDb.getByUnityId).toHaveBeenCalledWith("abc123");
    expect(userDb.getAllUser).not.toHaveBeenCalled();
  });

  test("GET /users returns 500 when DB read fails", async () => {
    userDb.getAllUser.mockRejectedValue(new Error("db down"));

    const res = await request(app).get("/users");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to fetch user" });
  });

  test("POST /users rejects invalid user payload", async () => {
    validateUser.mockReturnValue(false);

    const res = await request(app)
      .post("/users")
      .send({ unityID: "" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Unable to add user" });
    expect(userDb.addUser).not.toHaveBeenCalled();
  });

  test("POST /users adds valid user and redirects", async () => {
    validateUser.mockReturnValue(true);
    userDb.addUser.mockResolvedValue(123);

    const res = await request(app)
      .post("/users")
      .send({ unityID: "abc123", questionPriv: true, userPriv: false });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/templates/teacher-user-manage.html");
    expect(userDb.addUser).toHaveBeenCalledWith({
      unityID: "abc123",
      questionPriv: true,
      userPriv: false
    });
  });

  test("POST /users returns 500 if DB add fails", async () => {
    validateUser.mockReturnValue(true);
    userDb.addUser.mockRejectedValue(new Error("insert failed"));

    const res = await request(app)
      .post("/users")
      .send({ unityID: "abc123" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Unable to add user" });
  });

  test("DELETE /users deletes by userID", async () => {
    userDb.deleteUser.mockResolvedValue(1);

    const res = await request(app)
      .delete("/users")
      .send({ userID: 4 });

    expect(res.status).toBe(200);
    expect(userDb.deleteUser).toHaveBeenCalledWith(4);
  });

  test("DELETE /users returns 500 if delete fails", async () => {
    userDb.deleteUser.mockRejectedValue(new Error("delete failed"));

    const res = await request(app)
      .delete("/users")
      .send({ userID: 4 });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Unable to delete user" });
  });

  test("PUT /users updates and redirects", async () => {
    userDb.updateUser.mockResolvedValue(1);

    const payload = {
      userId: 5,
      unityID: "newid",
      questionPriv: false,
      userPriv: true
    };

    const res = await request(app)
      .put("/users")
      .send(payload);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/templates/teacher-user-manage.html");
    expect(userDb.updateUser).toHaveBeenCalledWith(payload, 5);
  });

  test("PUT /users returns 500 if update fails", async () => {
    userDb.updateUser.mockRejectedValue(new Error("update failed"));

    const res = await request(app)
      .put("/users")
      .send({ userId: 5, unityID: "newid" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Unable to update user" });
  });
});