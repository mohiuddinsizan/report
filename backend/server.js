const express = require("express");
const cors = require("cors");
const multer = require("multer");
const xlsx = require("xlsx");

const { generateStudentAnalysis } = require("./utils/studentAnalysis");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

function clean(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeField(value) {
  const field = clean(value).replace(/\s+/g, "_");

  const fieldMap = {
    correct: "correct",
    right: "correct",
    correct_answer: "correct",
    correct_answers: "correct",

    incorrect: "incorrect",
    wrong: "incorrect",
    incorrect_answer: "incorrect",
    incorrect_answers: "incorrect",

    skipped: "skipped",
    skip: "skipped",
    blank: "skipped",
    not_answered: "skipped",

    mcq_total: "mcqTotal",
    mcq: "mcqTotal",
    total_mcq: "mcqTotal",
    mcq_full_mark: "mcqTotal",
    mcq_full_marks: "mcqTotal",
    mcq_marks: "mcqTotal",

    written: "written",
    written_mark: "written",
    written_marks: "written",
    written_obtained: "written",
    written_obtained_mark: "written",
    written_obtained_marks: "written",
    cq: "written",
    cq_mark: "written",
    cq_marks: "written",

    written_total: "writtenTotal",
    written_full_mark: "writtenTotal",
    written_full_marks: "writtenTotal",
    total_written: "writtenTotal",
    cq_total: "writtenTotal",
    cq_full_mark: "writtenTotal",
    cq_full_marks: "writtenTotal",
  };

  return fieldMap[field] || field;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API WORKING",
  });
});

app.post("/api/upload-result", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    });

    if (!data || data.length < 3) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Excel format. First row must contain Roll and subject names, second row must contain fields like Correct, Incorrect, Skipped, MCQ Total, Written, Written Total.",
      });
    }

    const subjectRow = data[0];
    const fieldRow = data[1];

    let currentSubject = "";

    const columns = subjectRow.map((mainHeader, index) => {
      const main = String(mainHeader || "").trim();
      const sub = String(fieldRow[index] || "").trim();

      if (clean(main) === "roll") {
        return { type: "roll" };
      }

      if (main !== "") {
        currentSubject = main;
      }

      return {
        type: "subject",
        subject: currentSubject,
        field: normalizeField(sub),
      };
    });

    const students = [];

    for (let i = 2; i < data.length; i++) {
      const row = data[i];

      if (!row || row.length === 0) continue;

      const student = {
        id: students.length + 1,
        roll: "",
        subjects: {},
      };

      columns.forEach((col, colIndex) => {
        const value = row[colIndex];

        if (col.type === "roll") {
          student.roll = value;
          return;
        }

        if (!col.subject || !col.field) return;

        if (!student.subjects[col.subject]) {
          student.subjects[col.subject] = {
            correct: 0,
            incorrect: 0,
            skipped: 0,
            mcqTotal: 0,
            written: 0,
            writtenTotal: 0,
          };
        }

        const numericValue = toNumber(value);

        if (col.field === "correct") {
          student.subjects[col.subject].correct = numericValue;
        }

        if (col.field === "incorrect") {
          student.subjects[col.subject].incorrect = numericValue;
        }

        if (col.field === "skipped") {
          student.subjects[col.subject].skipped = numericValue;
        }

        if (col.field === "mcqTotal") {
          student.subjects[col.subject].mcqTotal = numericValue;
        }

        if (col.field === "written") {
          student.subjects[col.subject].written = numericValue;
        }

        if (col.field === "writtenTotal") {
          student.subjects[col.subject].writtenTotal = numericValue;
        }
      });

      if (student.roll !== "") {
        student.analysis = generateStudentAnalysis(student.subjects);
        students.push(student);
      }
    }

    res.json({
      success: true,
      totalStudents: students.length,
      students,
    });
  } catch (error) {
    console.error("Excel processing failed:", error);

    res.status(500).json({
      success: false,
      message: "Excel processing failed",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});