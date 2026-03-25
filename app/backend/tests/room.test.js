const express = require("express");
const request = require("supertest");

function buildApp() {
  const roomRouter = require("../rest_api/roomAPI");
  const app = express();
  app.use(express.json());
  app.use("/room", roomRouter);
  return app;
}

describe("roomAPI", () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    app = buildApp();
  });

  test("POST /room/create creates a room with a 4-digit code", async () => {
    const res = await request(app).post("/room/create");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("code");
    expect(res.body.code).toMatch(/^\d{4}$/);
  });

  test("created room can be fetched and has default settings", async () => {
    const createRes = await request(app).post("/room/create");
    const code = createRes.body.code;

    const getRes = await request(app).get(`/room/${code}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body).toEqual({
      players: [],
      settings: {
        questions: 25,
        categories: ["Category 1", "Category 2", "Category 3"]
      }
    });
  });

  test("joining a valid room adds player to player list", async () => {
    const createRes = await request(app).post("/room/create");
    const code = createRes.body.code;

    const joinRes = await request(app)
      .post("/room/join")
      .send({ code, name: "Alice" });

    expect(joinRes.status).toBe(200);
    expect(joinRes.body).toEqual({ success: true });

    const getRes = await request(app).get(`/room/${code}`);
    expect(getRes.body.players).toEqual(["Alice"]);
  });

  test("multiple players can join the same room", async () => {
    const createRes = await request(app).post("/room/create");
    const code = createRes.body.code;

    await request(app).post("/room/join").send({ code, name: "Alice" });
    await request(app).post("/room/join").send({ code, name: "Bob" });

    const getRes = await request(app).get(`/room/${code}`);
    expect(getRes.body.players).toEqual(["Alice", "Bob"]);
  });

  test("joining a non-existent room returns 404", async () => {
    const res = await request(app)
      .post("/room/join")
      .send({ code: "9999", name: "Alice" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Room not found" });
  });

  test("GET /room/:code returns 404 for missing room", async () => {
    const res = await request(app).get("/room/9999");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Room not found" });
  });

  test("POST /room/:code/settings overwrites room settings", async () => {
    const createRes = await request(app).post("/room/create");
    const code = createRes.body.code;

    const newSettings = {
      questions: 10,
      categories: ["1", "3", "5"]
    };

    const settingsRes = await request(app)
      .post(`/room/${code}/settings`)
      .send(newSettings);

    expect(settingsRes.status).toBe(200);
    expect(settingsRes.body).toEqual({ success: true });

    const getRes = await request(app).get(`/room/${code}`);
    expect(getRes.body.settings).toEqual(newSettings);
  });

  test("updating settings for missing room returns 404", async () => {
    const res = await request(app)
      .post("/room/9999/settings")
      .send({ questions: 20, categories: ["1"] });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Room not found" });
  });

  test("deleting a room removes it so future GET returns 404", async () => {
    const createRes = await request(app).post("/room/create");
    const code = createRes.body.code;

    const deleteRes = await request(app).delete(`/room/${code}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body).toEqual({ success: true });

    const getRes = await request(app).get(`/room/${code}`);
    expect(getRes.status).toBe(404);
  });
});