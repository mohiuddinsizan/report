function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function calculatePercentage(obtained, total) {
  const obtainedNumber = safeNumber(obtained);
  const totalNumber = safeNumber(total);

  if (!totalNumber || totalNumber <= 0) return 0;

  return Number(((obtainedNumber / totalNumber) * 100).toFixed(2));
}

function getSubjectTotalData(result) {
  const correct = safeNumber(result?.correct);
  const incorrect = safeNumber(result?.incorrect);
  const skipped = safeNumber(result?.skipped);
  const mcqTotal = safeNumber(result?.mcqTotal);
  const written = safeNumber(result?.written);
  const writtenTotal = safeNumber(result?.writtenTotal);

  const attemptedMcqTotal = correct + incorrect + skipped;
  const finalMcqTotal = mcqTotal > 0 ? mcqTotal : attemptedMcqTotal;

  const mcqPercentage = calculatePercentage(correct, finalMcqTotal);
  const writtenPercentage = calculatePercentage(written, writtenTotal);

  const totalObtained = correct + written;
  const totalMarks = finalMcqTotal + writtenTotal;

  const totalPercentage = calculatePercentage(totalObtained, totalMarks);

  return {
    correct,
    incorrect,
    skipped,
    mcqTotal: finalMcqTotal,
    written,
    writtenTotal,
    totalObtained,
    totalMarks,
    mcqPercentage,
    writtenPercentage,
    totalPercentage,
  };
}

/**
 * Used only for backend matching/classification.
 * Frontend display name remains unchanged because selected[subjectName] keeps original Excel key.
 *
 * Example:
 * "Higher Math-8" => "higher math"
 * "Islam (8)" => "islam"
 * "Hindu - A" => "hindu"
 */
function normalizeSubjectName(name) {
  return String(name || "")
    .trim()
    .replace(/[‐-‒–—―]/g, "-") // convert different dash types to normal hyphen
    .replace(/\s+/g, " ")
    .replace(/\s*\([^)]*\)\s*$/g, "") // remove tail like " (8)"
    .replace(/\s*\[[^\]]*\]\s*$/g, "") // remove tail like " [8]"
    .replace(/\s*-\s*[^-]+$/g, "") // remove tail like "-8", "- A", "- Section 1"
    .replace(/\s+\d+$/g, "") // remove tail like " 8"
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Alternative subjects:
 * A student should normally attend only one subject from each group.
 *
 * Example:
 * If a student has Islam data, Hindu should not count.
 * If a student has Hindu data, Islam should not count.
 */
const mutuallyExclusiveSubjectGroups = [
  ["Islam", "Hindu"],
];

/**
 * Optional subjects:
 * These subjects should count only if the student has actual data.
 *
 * Example:
 * Agriculture column may exist in Excel, but not every student attends Agriculture.
 * If Agriculture has no correct/incorrect/skipped/written data, it will be removed.
 */
const optionalSubjectsThatNeedData = [
  "Agriculture",
];

/**
 * Checks whether the student actually has performance data in this subject.
 *
 * Important:
 * We do NOT use mcqTotal/writtenTotal alone as "activity",
 * because Excel may contain total columns for all subjects even when
 * a student did not attend that optional subject.
 */
function getSubjectActivityScore(result) {
  const correct = safeNumber(result?.correct);
  const incorrect = safeNumber(result?.incorrect);
  const skipped = safeNumber(result?.skipped);
  const written = safeNumber(result?.written);

  return correct + incorrect + skipped + written;
}

/**
 * Remove unused alternative subjects per student.
 *
 * Example:
 * subjects = {
 *   Islam: { correct: 20, incorrect: 2, skipped: 3, mcqTotal: 25 },
 *   Hindu: { correct: 0, incorrect: 0, skipped: 0, mcqTotal: 25 }
 * }
 *
 * Result:
 * Hindu is removed for this student.
 */
function filterMutuallyExclusiveSubjects(subjects) {
  const cleanedSubjects = { ...(subjects || {}) };

  mutuallyExclusiveSubjectGroups.forEach((group) => {
    const normalizedGroup = group.map(normalizeSubjectName);

    const matchingSubjects = Object.entries(cleanedSubjects).filter(
      ([subjectName]) =>
        normalizedGroup.includes(normalizeSubjectName(subjectName))
    );

    if (matchingSubjects.length <= 1) return;

    const withActivity = matchingSubjects.map(([subjectName, result]) => ({
      subjectName,
      result,
      activityScore: getSubjectActivityScore(result),
      totalData: getSubjectTotalData(result),
    }));

    const activeSubjects = withActivity.filter((item) => item.activityScore > 0);

    // If no subject has actual activity, remove all subjects in this alternative group.
    if (activeSubjects.length === 0) {
      withActivity.forEach((item) => {
        delete cleanedSubjects[item.subjectName];
      });
      return;
    }

    // If one or more have data, keep the strongest one.
    // Normally only one will have data.
    activeSubjects.sort((a, b) => {
      if (b.activityScore !== a.activityScore) {
        return b.activityScore - a.activityScore;
      }

      return b.totalData.totalPercentage - a.totalData.totalPercentage;
    });

    const subjectToKeep = activeSubjects[0].subjectName;

    withActivity.forEach((item) => {
      if (item.subjectName !== subjectToKeep) {
        delete cleanedSubjects[item.subjectName];
      }
    });
  });

  return cleanedSubjects;
}

/**
 * Remove optional subjects if that student has no actual data.
 *
 * Example:
 * Agriculture column exists in Excel, but student did not attend Agriculture.
 * Then Agriculture should not reduce the student's total percentage.
 */
function filterEmptyOptionalSubjects(subjects) {
  const cleanedSubjects = { ...(subjects || {}) };
  const optionalSet = new Set(optionalSubjectsThatNeedData.map(normalizeSubjectName));

  Object.entries(cleanedSubjects).forEach(([subjectName, result]) => {
    const normalizedName = normalizeSubjectName(subjectName);

    if (!optionalSet.has(normalizedName)) return;

    const activityScore = getSubjectActivityScore(result);

    if (activityScore <= 0) {
      delete cleanedSubjects[subjectName];
    }
  });

  return cleanedSubjects;
}

function getSubjectWiseComment(totalPercentage) {
  const percentage = safeNumber(totalPercentage);

  if (percentage >= 90) {
    return {
      category: "প্রস্তুতি খুবই ভালো পর্যায়ে আছে",
      comment:
        "এই বিষয়ে তোমার দক্ষতা প্রশংসনীয়। এই ভাবে প্রস্তুতি ঠিক থাকলে এই বিষয় নিয়ে আর নতুন করে কোনো দুশ্চিন্তা করার কিছু নেই। বর্তমানে যেভাবে প্রস্তুতি নিচ্ছো সেভাবেই নিতে থাকো।",
    };
  }

  if (percentage >= 80 && percentage <= 89) {
    return {
      category: "প্রস্তুতি ঠিক পথেই আছে",
      comment:
        "এই বিষয়ে তুমি ভালো করেছো। যদিও আরও একটু ভালো করার জায়গা রয়েছে। যদি তুমি তোমার ভুল গুলো খুঁজে বের করো এবং সেগুলোর উপর দক্ষতা অর্জন করো , এক্ষেত্রে আমাদের অভিজ্ঞ মেন্টরের থেকে তুমি সাহায্য নিতে পারো।",
    };
  }

  if (percentage >= 65 && percentage <= 79) {
    return {
      category: "একদম Perfect প্রস্তুতি নিতে চাইলে পরিশ্রম আরও বাড়াতে হবে",
      comment:
        "এই বিষয়ে তোমার প্রস্তুতিতে কিছুটা ঘাটতি রয়েছে। সেই ঘাটতি চিহ্নিত করে পূরণ করা সম্ভব। নিজের সমস্যা গুলো খুঁজে বের করো এবং প্রয়োজনে মেন্টরের সাহায্য নিয়ে সেগুলো সমাধান করে নাও।",
    };
  }

  if (percentage >= 50 && percentage <= 64) {
    return {
      category: "আরও ভালো প্রস্তুতির জন্য পড়ার ধরনে পরিবর্তন আনা দরকার",
      comment:
        "এই বিষয়ে তুমি হয়তো পিছিয়ে পড়েছো। এক্ষেত্রে তোমার পড়ার ধরন পরিবর্তন করে ভুল গুলোর উপর জোর দিতে হবে যেনো প্রস্তুতি আরো দৃঢ় করা সম্ভব হয়। প্রয়োজনে আমাদের অভিজ্ঞ মেন্টরের সহায়তা নাও।",
    };
  }

  if (percentage >= 30 && percentage <= 49) {
    return {
      category: "সবকিছু একদম নতুনভাবে শুরু করতে হবে",
      comment:
        "যদি ভালো করতে চাও তবে ঘুরে দাঁড়ানোর এখনো সময় আছে। প্রয়োজনে মেন্টরের সাথে কথা বলে সমস্যাগুলো চিহ্নিত করো এবং অবশ্যই পড়াশোনায় আরও বেশি জোর দেওয়া দরকার।",
    };
  }

  return {
    category: "সবকিছু একদম নতুনভাবে শুরু করতে হবে",
    comment:
      "যদি ভালো করতে চাও তবে ঘুরে দাঁড়ানোর এখনো সময় আছে। প্রয়োজনে মেন্টরের সাথে কথা বলে সমস্যাগুলো চিহ্নিত করো এবং অবশ্যই পড়াশোনায় আরও বেশি জোর দেওয়া দরকার।",
  };
}

function calculatePercentages(subjects) {
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalSkipped = 0;
  let totalMcq = 0;
  let totalWritten = 0;
  let totalWrittenMarks = 0;

  Object.values(subjects || {}).forEach((subject) => {
    const subjectData = getSubjectTotalData(subject);

    totalCorrect += subjectData.correct;
    totalIncorrect += subjectData.incorrect;
    totalSkipped += subjectData.skipped;
    totalMcq += subjectData.mcqTotal;
    totalWritten += subjectData.written;
    totalWrittenMarks += subjectData.writtenTotal;
  });

  const attemptedTotal = totalCorrect + totalIncorrect + totalSkipped;
  const baseMcqTotal = totalMcq > 0 ? totalMcq : attemptedTotal;

  const totalObtained = totalCorrect + totalWritten;
  const totalMarks = baseMcqTotal + totalWrittenMarks;

  const correctPercentage = calculatePercentage(totalCorrect, baseMcqTotal);
  const incorrectPercentage = calculatePercentage(totalIncorrect, baseMcqTotal);
  const skippedPercentage = calculatePercentage(totalSkipped, baseMcqTotal);
  const writtenPercentage = calculatePercentage(totalWritten, totalWrittenMarks);
  const totalPercentage = calculatePercentage(totalObtained, totalMarks);

  return {
    totalCorrect,
    totalIncorrect,
    totalSkipped,
    totalMcq: baseMcqTotal,
    totalWritten,
    totalWrittenMarks,
    totalObtained,
    totalMarks,
    correctPercentage,
    incorrectPercentage,
    skippedPercentage,
    writtenPercentage,
    totalPercentage,
  };
}

const commentRules = [
  {
    id: 8,
    category: "প্রস্তুতির খুবই দুর্বল অবস্থা",
    check: (p) => p.totalPercentage < 30,
    comment:
      "এখন থেকে পড়াশোনায় মনোযোগী না হলে সামনে আগানো খুবই কঠিন হবে। পড়ার Guideline এর প্রয়োজন হলে Mentor দের সাথে যোগাযোগ কর এবং ভালোভাবে শুরু করো।",
  },
  {
    id: 1,
    category: "প্রস্তুতি একদম perfect",
    check: (p) => p.totalPercentage >= 90,
    comment:
      "তোমার প্রস্তুতি একদম ঠিক আছে তবে অবশ্যই এই ধারা অব্যাহত রাখতে হবে, কোনভাবেই কিছু হালকা ভাবে নেয়া যাবে না।",
  },
  {
    id: 2,
    category: "প্রস্তুতি ভালো পর্যায়ে আছে, আরও একটু ভালো করা সম্ভব",
    check: (p) =>
      p.totalPercentage < 90 &&
      p.totalPercentage > 70 &&
      p.skippedPercentage + 5.0 > p.incorrectPercentage,
    comment:
      "তুমি ঠিক জায়গায় আছো, এভাবে Continue করতে পারলে সামনে আরও ভালো করতে পারবে তবে অবশ্যই তোমার আত্মবিশ্বাস বাড়াতে হবে কারণ তুমি এর ভেতরে অনেক প্রশ্ন গুলো Attempt করো নি।",
  },
  {
    id: 3,
    category: "প্রস্তুতি ভালো তবে সাবধান হওয়া জরুরি",
    check: (p) =>
      p.totalPercentage < 90 &&
      p.totalPercentage > 70 &&
      p.incorrectPercentage > p.skippedPercentage + 5,
    comment:
      "তুমি ঠিক জায়গায় এগিয়ে যাচ্ছো । তবে ভুল উত্তর করে ফেলেছো অনেক বেশি; সব উত্তর করতে হবে এই চিন্তা থেকে বেরিয়ে সঠিক উত্তর করার দিকে বেশি জোর দাও।",
  },
  {
    id: 4,
    category: "প্রস্তুতি Properly নেওয়া হচ্ছে না",
    check: (p) =>
      p.totalPercentage >= 50 &&
      p.totalPercentage <= 70 &&
      p.skippedPercentage + 10 < p.incorrectPercentage,
    comment:
      "তোমার ভুল উত্তরগুলো তোমাকে পিছিয়ে দিচ্ছে। পড়াশোনায় মনোযোগ বাড়াতে হবে এবং উত্তর করার ক্ষেত্রে সাবধানতা অবলম্বন করতে হবে। প্রয়োজনে মেন্টরের সাথে যোগাযোগ করো।",
  },
  {
    id: 5,
    category: "তোমার প্রস্তুতি সম্পূর্ণ হওয়ার আগেই তুমি পরীক্ষা দিচ্ছো",
    check: (p) =>
      p.totalPercentage >= 50 &&
      p.totalPercentage <= 70 &&
      p.skippedPercentage + 5 > p.incorrectPercentage,
    comment:
      "কোথাও কোনো সমস্যার কারণে তুমি ঠিকঠাক প্রস্তুতি নিতে পারছো না। আগে তোমার সমস্যার জায়গাটি চিহ্নিত করতে হবে প্রয়োজনে মেন্টরের সাহায্য নাও এবং আত্মবিশ্বাস বাড়াতে হবে কারণ এতো skip করা যাবে না।",
  },
  {
    id: 6,
    category: "প্রস্তুতির খুবই দুর্বল অবস্থা",
    check: (p) =>
      p.totalPercentage >= 30 &&
      p.totalPercentage <= 50 &&
      p.skippedPercentage + 5 < p.incorrectPercentage,
    comment:
      "এখন থেকে পড়াশোনায় মনোযোগী না হলে সামনে আগানো খুবই কঠিন হবে। পড়ার Guideline এর প্রয়োজন হলে Mentor দের সাথে যোগাযোগ কর এবং ভালোভাবে শুরু করো।",
  },
  {
    id: 7,
    category: "প্রস্তুতির খুবই দুর্বল অবস্থা",
    check: (p) =>
      p.totalPercentage >= 30 &&
      p.totalPercentage <= 50 &&
      p.skippedPercentage + 5 > p.incorrectPercentage,
    comment:
      "এখন থেকে পড়াশোনায় মনোযোগী না হলে সামনে আগানো খুবই কঠিন হবে। পড়ার Guideline এর প্রয়োজন হলে Mentor দের সাথে যোগাযোগ কর এবং ভালোভাবে শুরু করো।",
  },
];

const scienceSubjects = [
  "Physics",
  "Chemistry",
  "General Math",
  "Higher Math",
  "Biology",
  "BGS",
  "Physics 1st",
  "Physics 2nd",
  "Chemistry 1st",
  "Chemistry 2nd",
  "Biology 1st",
  "Biology 2nd",
  "Higher Math 1st",
  "Higher Math 2nd",
];

const generalSubjects = [
  "Bangla 1st",
  "Bangla 2nd",
  "English 1st",
  "English 2nd",
  "Religion",
  "ICT",
  "Agriculture",
  "Islam",
  "Hindu",
];

function getSubjectsByNames(subjects, allowedNames) {
  const allowed = new Set(allowedNames.map(normalizeSubjectName));
  const selected = {};

  Object.entries(subjects || {}).forEach(([subjectName, value]) => {
    const subjectNameForMatching = normalizeSubjectName(subjectName);

    if (allowed.has(subjectNameForMatching)) {
      // Keep original Excel subject name for frontend display.
      // Example: "Higher Math-8" will match "Higher Math",
      // but frontend will still show "Higher Math-8".
      selected[subjectName] = value;
    }
  });

  return selected;
}

function getInitialComment(percentageData) {
  const matchedRule = commentRules.find((rule) => rule.check(percentageData));

  return {
    ruleId: matchedRule ? matchedRule.id : null,
    category: matchedRule ? matchedRule.category : "মেন্টরের সাথে একটু বসা দরকার",
    comment: matchedRule
      ? matchedRule.comment
      : "তোমার ফলাফলটা ঠিক কোন ছকে ফেলব বোঝা যাচ্ছে না। তাই বিষয়ভিত্তিক নম্বরগুলো নিয়ে একবার মেন্টরের সাথে বসো—কোথায় ভালো আর কোথায় কমতি দেখে সামনের পরিকল্পনাটা একসাথে ঠিক করে নেব।",
  };
}

function generatePartitionAnalysis(title, subjects) {
  const percentageData = calculatePercentages(subjects);
  const commentData = getInitialComment(percentageData);

  return {
    title,
    ...percentageData,
    ...commentData,
  };
}

function generateScienceComparisonComment(scienceData, generalData) {
  const sciencePercent = scienceData.totalPercentage || 0;
  const generalPercent = generalData.totalPercentage || 0;
  const deviation = Number(Math.abs(sciencePercent - generalPercent).toFixed(2));

  const weakerPart =
    sciencePercent < generalPercent
      ? "science"
      : generalPercent < sciencePercent
      ? "general"
      : "equal";

  if (deviation < 15) {
    return {
      deviation,
      weakerPart,
      category: "Science আর General—দুটোতেই ভারসাম্য ভালো",
      comment:
        "Science আর General দুই দিকেই তোমার অবস্থা প্রায় কাছাকাছি, এটা খুব ভালো লক্ষণ। যেদিকটায় নম্বর সামান্য কম এসেছে, সেখানে একটু বেশি রিভিশন দিলেই সব মিলিয়ে ফলটা আরো সুন্দর দেখাবে।",
    };
  }

  if (deviation <= 30) {
    if (weakerPart === "science") {
      return {
        deviation,
        weakerPart,
        category: "Science-এ একটু বেশি সময় দাও",
        comment:
          "General-এর তুলনায় Science-এ তুমি একটু পিছিয়ে আছ। Physics, Chemistry, Math, Biology-গুলো মুখস্থ না করে বুঝে পড়ো আর নিয়মিত Mathematical Problem সমাধান করলে উন্নতি সম্ভব। একটু বাড়তি সময় দিলেই এই দিকটা সামলে যাবে।",
      };
    }

    return {
      deviation,
      weakerPart,
      category: "General অংশে রিভিশন একটু বাড়াও",
      comment:
        "Science-এর তুলনায় General বিষয়গুলোতে তুমি একটু পিছিয়ে। Bangla, English, Religion, ICT সহজ মনে হলেও নিয়মিত না দেখলে নম্বর পড়ে যায়। প্রতিদিন অল্প করে হলেও এগুলো রিভিশন দাও, পার্থক্যটা ঠিক কমে আসবে।",
    };
  }

  if (weakerPart === "science") {
    return {
      deviation,
      weakerPart,
      category: "Science-এর বেসিকটা শক্ত করা দরকার",
      comment:
        "Science-এ পার্থক্যটা বেশ বড়। ঘাবড়ে না গিয়ে গোড়া থেকে ধরো—বেসিক কনসেপ্ট আর সূত্রগুলো ভালো করে বুঝে নাও, মেন্টরের সাহায্য নিয়ে নিয়মিত অনুশীলন করো। ঠিকভাবে শুরু করলে এই দূরত্বটা ধীরে ধীরে কমে যাবে।",
    };
  }

  return {
    deviation,
    weakerPart,
    category: "General বিষয়গুলো নিয়মিত পড়া দরকার",
    comment:
      "General বিষয়গুলোতে অনেকটাই পিছিয়ে আছ। এই বিষয়গুলোতে নিয়মিত পড়া, লেখা আর রিভিশনের কোনো বিকল্প নেই। প্রতিদিন একটা নির্দিষ্ট সময় এগুলোর জন্য রাখো , অল্প দিনেই ভালো করা সম্ভব।",
  };
}

function calculateSubjectPercentages(subjects) {
  return Object.entries(subjects || {}).map(([subjectName, result]) => {
    const subjectData = getSubjectTotalData(result);
    const subjectCommentData = getSubjectWiseComment(
      subjectData.totalPercentage
    );

    return {
      subject: subjectName,

      correct: subjectData.correct,
      incorrect: subjectData.incorrect,
      skipped: subjectData.skipped,
      mcqTotal: subjectData.mcqTotal,

      written: subjectData.written,
      writtenTotal: subjectData.writtenTotal,

      totalObtained: subjectData.totalObtained,
      totalMarks: subjectData.totalMarks,

      mcqPercentage: subjectData.mcqPercentage,
      writtenPercentage: subjectData.writtenPercentage,

      percentage: subjectData.totalPercentage,
      totalPercentage: subjectData.totalPercentage,

      subjectCommentCategory: subjectCommentData.category,
      subjectComment: subjectCommentData.comment,
    };
  });
}

function generateSubjectConsistencyAnalysis(subjects) {
  const subjectBars = calculateSubjectPercentages(subjects);

  const validSubjects = subjectBars.filter((item) => item.totalMarks > 0);

  if (validSubjects.length === 0) {
    return {
      subjectBars,
      averagePercentage: 0,
      consistentPercentage: 0,
      level: "ডেটা পাওয়া যায়নি",
      comment: "বিষয়ভিত্তিক হিসাব করার মতো যথেষ্ট তথ্য এখানে নেই।",
    };
  }

  const percentages = validSubjects.map((item) => item.totalPercentage);

  const sorted = [...percentages].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  const median =
    sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];

  const filtered = validSubjects.filter((item) => {
    const deviation = Math.abs(item.totalPercentage - median);
    return deviation <= 25;
  });

  const finalData = filtered.length > 0 ? filtered : validSubjects;

  const averagePercentage = Number(
    (
      finalData.reduce((sum, item) => sum + item.totalPercentage, 0) /
      finalData.length
    ).toFixed(2)
  );

  const totalSubjects = validSubjects.length;

  const lowSubjectCount = validSubjects.filter(
    (item) => item.totalPercentage < 55
  ).length;

  const lowSubjectRatio = Number(
    ((lowSubjectCount / totalSubjects) * 100).toFixed(2)
  );

  let level = "";
  let comment = "";

  if (averagePercentage < 55 && lowSubjectRatio >= 60) {
    level = "পড়ার সাথে নিয়মিত যোগটা শক্ত করা দরকার";

    comment =
      "বেশিরভাগ বিষয়েই নম্বর কম এসেছে। দু-একটা বিষয়ে হঠাৎ ভালো বা খারাপ বাদ দিলেও বোঝা যাচ্ছে, পড়ার সাথে তোমার নিয়মিত যোগটা আরেকটু শক্ত হওয়া দরকার। প্রতিদিন নির্দিষ্ট সময় বসো, ছোট ছোট লক্ষ্য ঠিক করো, আর মেন্টরের নজরে থেকে এগোও—ধীরে ধীরে ঠিক ঘুরে দাঁড়াবে।";
  } else if (averagePercentage < 70) {
    level = "মাঝারি পর্যায়ের প্রস্তুতি";

    comment =
      "তোমার প্রস্তুতি এখন মাঝামাঝি অবস্থায়। একটু বেশি সময়, একটু বেশি অনুশীলন আর কম নম্বর পাওয়া বিষয়গুলোতে আলাদা মনোযোগ দিলেই হবে। কোন কোন বিষয়ে তুমি ভালো করছ আর ঠিক কোথায় নম্বর হারাচ্ছ—সেটা দেখে প্রস্তুতির দিকটা গুছিয়ে নাও।";
  } else {
    level = "ভালো পথেই আছ";

    comment =
      "সব মিলিয়ে তুমি ভালো পথেই আছ। এই জায়গাটা ধরে রাখতে নিয়মিত অনুশীলন আর রিভিশন চালিয়ে যাও। ভালো ফলের মধ্যেও একটু খেয়াল করো—কোন অংশে সবচেয়ে শক্তিশালী আর কোথায় আর একটু নজর দিলে ফলটা আরো ভালো হবে।";
  }

  return {
    subjectBars,
    averagePercentage,
    medianPercentage: Number(median.toFixed(2)),
    lowSubjectCount,
    lowSubjectRatio,
    level,
    comment,
  };
}

function generateStudentAnalysis(subjects) {
  // Step 1: Remove unused Islam/Hindu alternative subject.
  let cleanedSubjects = filterMutuallyExclusiveSubjects(subjects);

  // Step 2: Remove optional subjects like Agriculture if the student has no data.
  cleanedSubjects = filterEmptyOptionalSubjects(cleanedSubjects);

  const percentageData = calculatePercentages(cleanedSubjects);
  const overallComment = getInitialComment(percentageData);

  const scienceAnalysis = generatePartitionAnalysis(
    "Science",
    getSubjectsByNames(cleanedSubjects, scienceSubjects)
  );

  const generalAnalysis = generatePartitionAnalysis(
    "General",
    getSubjectsByNames(cleanedSubjects, generalSubjects)
  );

  return {
    ...percentageData,
    ...overallComment,

    subjectConsistency: generateSubjectConsistencyAnalysis(cleanedSubjects),

    partitions: {
      science: scienceAnalysis,
      nonScience: generalAnalysis,
      comparison: generateScienceComparisonComment(
        scienceAnalysis,
        generalAnalysis
      ),
    },
  };
}

module.exports = {
  generateStudentAnalysis,
  commentRules,
  getSubjectWiseComment,

  // Optional exports for testing/debugging
  normalizeSubjectName,
  filterMutuallyExclusiveSubjects,
  filterEmptyOptionalSubjects,
};