const validateUser = require("../db_queries/user-validation");
const validateQuestion = require("../db_queries/question-validation");

describe("validateUser", () => {
  test("accepts a valid unityID of length 8", () => {
    expect(validateUser({ unityID: "abc12345" })).toBe(true);
  });

  test("rejects missing unityID", () => {
    expect(validateUser({})).toBe(false);
  });

  test("rejects empty unityID", () => {
    expect(validateUser({ unityID: "" })).toBe(false);
  });

  test("rejects unityID longer than 8 characters", () => {
    expect(validateUser({ unityID: "abcdefghi" })).toBe(false);
  });

  test("accepts short valid unityID", () => {
    expect(validateUser({ unityID: "bob1" })).toBe(true);
  });
});

describe("validateQuestion", () => {
  const validQuestion = {
    question: "What material is commonly recycled in curbside programs?",
    category: 3,
    correctAnswer: "Paper",
    wrongAnswer1: "Sand",
    wrongAnswer2: "Oil",
    wrongAnswer3: "Glass wool",
    ai: "0"
  };

  test("accepts a fully valid question", () => {
    expect(validateQuestion(validQuestion)).toBe(true);
  });

  test("rejects missing question text", () => {
    expect(validateQuestion({ ...validQuestion, question: "" })).toBe(false);
  });

  test("rejects missing category", () => {
    expect(validateQuestion({ ...validQuestion, category: null })).toBe(false);
  });

  test("rejects missing correct answer", () => {
    expect(validateQuestion({ ...validQuestion, correctAnswer: "" })).toBe(false);
  });

  test("rejects when incorrect answers are not all present", () => {
    expect(validateQuestion({ ...validQuestion, wrongAnswer3: "" })).toBe(false);
  });

  test("rejects duplicate incorrect answers", () => {
    expect(
      validateQuestion({
        ...validQuestion,
        wrongAnswer2: "Sand",
        wrongAnswer3: "Glass wool"
      })
    ).toBe(false);
  });

  test("rejects when correct answer matches an incorrect answer", () => {
    expect(
      validateQuestion({
        ...validQuestion,
        wrongAnswer1: "Paper"
      })
    ).toBe(false);
  });

  test("accepts ai value as string 0", () => {
    expect(validateQuestion({ ...validQuestion, ai: "0" })).toBe(true);
  });

  test("accepts ai value as string 1", () => {
    expect(validateQuestion({ ...validQuestion, ai: "1" })).toBe(true);
  });

  test("rejects invalid ai value", () => {
    expect(validateQuestion({ ...validQuestion, ai: "2" })).toBe(false);
  });
});