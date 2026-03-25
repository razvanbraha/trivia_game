jest.mock("../db_queries/question-validation.js", () => jest.fn());
jest.mock("../db_queries/questions-db.js", () => ({
  addQuestion: jest.fn(),
  updateQuestion: jest.fn(),
  deleteQuestion: jest.fn(),
  getAllQuestion: jest.fn(),
  getByCategory: jest.fn(),
  getByID: jest.fn()
}));

const express = require("express");
const request = require("supertest");
const validateQuestion = require("../db_queries/question-validation.js");
const questionDb = require("../db_queries/questions-db.js");
const questionRouter = require("../rest_api/dbAPI");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/questions", questionRouter);
  return app;
}

describe("dbAPI / questions routes", () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.clearAllMocks();
  });

  test("GET /questions/populate returns all questions when no query is provided", async () => {
    const fakeQuestions = [{ questionID: 1, question: "Q1" }];
    questionDb.getAllQuestion.mockResolvedValue(fakeQuestions);

    const res = await request(app).get("/questions/populate");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeQuestions);
    expect(questionDb.getAllQuestion).toHaveBeenCalledTimes(1);
    expect(questionDb.getByID).not.toHaveBeenCalled();
    expect(questionDb.getByCategory).not.toHaveBeenCalled();
  });

  test("GET /questions/populate?id=... returns question by ID", async () => {
    const fakeQuestion = { questionID: 7, question: "Q7" };
    questionDb.getByID.mockResolvedValue(fakeQuestion);

    const res = await request(app).get("/questions/populate?id=7");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeQuestion);
    expect(questionDb.getByID).toHaveBeenCalledWith("7");
    expect(questionDb.getAllQuestion).not.toHaveBeenCalled();
  });

  test("GET /questions/populate?category=... returns questions by category", async () => {
    const fakeQuestions = [{ questionID: 2, category: 3 }];
    questionDb.getByCategory.mockResolvedValue(fakeQuestions);

    const res = await request(app).get("/questions/populate?category=3");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeQuestions);
    expect(questionDb.getByCategory).toHaveBeenCalledWith("3");
  });

  test("GET /questions/populate returns 500 on DB failure", async () => {
    questionDb.getAllQuestion.mockRejectedValue(new Error("db fail"));

    const res = await request(app).get("/questions/populate");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to fetch questions" });
  });

  test("POST /questions/create rejects invalid question payload", async () => {
    validateQuestion.mockReturnValue(false);

    const res = await request(app)
      .post("/questions/create")
      .send({ question: "" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Unable to add question" });
    expect(questionDb.addQuestion).not.toHaveBeenCalled();
  });

  test("POST /questions/create accepts valid payload and calls addQuestion", async () => {
    validateQuestion.mockReturnValue(true);
    questionDb.addQuestion.mockResolvedValue(10);

    const payload = {
      question: "What is composting?",
      correctAnswer: "Organic decomposition",
      wrongAnswer1: "Burning plastic",
      wrongAnswer2: "Mining",
      wrongAnswer3: "Landfilling glass",
      category: 5,
      ai: "0"
    };

    const res = await request(app)
      .post("/questions/create")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: "Question added" });
    expect(questionDb.addQuestion).toHaveBeenCalledWith(payload);
  });

  test("PUT /questions/update rejects invalid update payload", async () => {
    validateQuestion.mockReturnValue(false);

    const res = await request(app)
      .put("/questions/update")
      .send({
        questionId: 4,
        questionData: { question: "" }
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Unable to add question" });
    expect(questionDb.updateQuestion).not.toHaveBeenCalled();
  });

  test("PUT /questions/update accepts valid payload and calls updateQuestion", async () => {
    validateQuestion.mockReturnValue(true);
    questionDb.updateQuestion.mockResolvedValue(1);

    const questionData = {
      question: "Updated question",
      correctAnswer: "A",
      wrongAnswer1: "B",
      wrongAnswer2: "C",
      wrongAnswer3: "D",
      category: 1,
      ai: "1"
    };

    const res = await request(app)
      .put("/questions/update")
      .send({
        questionId: 4,
        questionData
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Question updated" });
    expect(questionDb.updateQuestion).toHaveBeenCalledWith(questionData, 4);
  });

  test("DELETE /questions/delete calls deleteQuestion with provided ID", async () => {
    questionDb.deleteQuestion.mockResolvedValue(1);

    const res = await request(app)
      .delete("/questions/delete")
      .send({ questionId: 9 });

    expect(res.status).toBe(200);
    expect(questionDb.deleteQuestion).toHaveBeenCalledWith(9);
  });

  test("should return 500 when getByID throws", async () => {
    questionDb.getByID.mockRejectedValue(new Error("read failed"));

    const res = await request(app).get("/questions/populate?id=3");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to fetch questions" });
  });

  test("POST /questions/create should return 500 if addQuestion rejects", async () => {
    validateQuestion.mockReturnValue(true);
    questionDb.addQuestion.mockRejectedValue(new Error("insert failed"));

    const payload = {
      question: "What is LCA?",
      correctAnswer: "Life Cycle Assessment",
      wrongAnswer1: "Local Carbon Audit",
      wrongAnswer2: "Linear Cost Analysis",
      wrongAnswer3: "Label Compliance Act",
      category: 3,
      ai: "0"
    };

    const res = await request(app)
      .post("/questions/create")
      .send(payload);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Unable to add question" });
  });

  test("PUT /questions/update should return 500 if updateQuestion rejects", async () => {
    validateQuestion.mockReturnValue(true);
    questionDb.updateQuestion.mockRejectedValue(new Error("update failed"));

    const res = await request(app)
      .put("/questions/update")
      .send({
        questionId: 8,
        questionData: {
          question: "Updated",
          correctAnswer: "A",
          wrongAnswer1: "B",
          wrongAnswer2: "C",
          wrongAnswer3: "D",
          category: 2,
          ai: "0"
        }
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Unable to update question" });
  });

  
  test("DELETE /questions/delete should return 500 if deleteQuestion rejects", async () => {
    questionDb.deleteQuestion.mockRejectedValue(new Error("delete failed"));

    const res = await request(app)
      .delete("/questions/delete")
      .send({ questionId: 11 });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Unable to delete question" });
  });
});