const express = require("express");
const cors = require("cors");
const multer = require("multer");
const xlsx = require("xlsx");

const { generateMeritList } = require("./utils/studentAnalysis");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

function clean(value) {
  return String(value || "").trim().toLowerCase();
}

/**
 * Header text with inner whitespace collapsed, so "Student  Name" and
 * "Student Name" match the same entry.
 */
function headerKey(value) {
  return clean(value).replace(/\s+/g, " ");
}

/**
 * Identity columns. These sit before the subject blocks and have a BLANK
 * second row, so they must be detected before the "main !== ''" branch —
 * otherwise "Name" would be treated as a subject title.
 */
const rollHeaders = new Set(["roll", "roll no", "roll number", "roll_no"]);

const nameHeaders = new Set([
  "name",
  "student name",
  "student_name",
  "students name",
  "student's name",
]);

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

      const mainKey = headerKey(main);

      if (rollHeaders.has(mainKey)) {
        return { type: "roll" };
      }

      // ✅ Name is an identity column, not a subject. Checked here so it never
      // reaches the branch below and becomes currentSubject.
      if (nameHeaders.has(mainKey)) {
        return { type: "name" };
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
        name: "",
        subjects: {},
      };

      columns.forEach((col, colIndex) => {
        const value = row[colIndex];

        if (col.type === "roll") {
          student.roll = value;
          return;
        }

        // ✅ Name is text, so it must NOT go through toNumber()
        if (col.type === "name") {
          student.name = String(value || "").trim();
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
        students.push(student);
      }
    }

    // ✅ Merit is a comparison ACROSS students, so the whole sheet is analysed
    // in one call. Analysing each student separately (the old loop) can never
    // produce a rank, because a single analysis has nothing to compare against.
    const analyses = generateMeritList(
      students.map((student) => ({
        name: student.name,
        roll: student.roll,
        subjects: student.subjects,
      }))
    );

    // generateMeritList returns best-first, so inputIndex maps each analysis
    // back to its original sheet row.
    analyses.forEach((analysis) => {
      const student = students[analysis.inputIndex];
      if (!student) return;

      student.analysis = analysis;
      student.merit = analysis.merit;
    });

    // students stays in SHEET order so existing frontend code keeps working.
    // meritOrder lists student ids best-first for rendering a merit table.
    const meritOrder = analyses
      .filter((analysis) => analysis.merit !== null)
      .map((analysis) => students[analysis.inputIndex]?.id)
      .filter((id) => id !== undefined);

    res.json({
      success: true,
      totalStudents: students.length,
      totalRanked: meritOrder.length,
      meritOrder,
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