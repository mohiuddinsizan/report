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
  const correct = safeNumber(result.correct);
  const incorrect = safeNumber(result.incorrect);
  const skipped = safeNumber(result.skipped);
  const mcqTotal = safeNumber(result.mcqTotal);
  const written = safeNumber(result.written);
  const writtenTotal = safeNumber(result.writtenTotal);

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

function getSubjectWiseComment(totalPercentage) {
  const percentage = safeNumber(totalPercentage);

  if (percentage >= 90) {
    return {
      category: "দারুণ করছ, এভাবেই এগিয়ে যাও",
      comment:
        "এই বিষয়ে তোমার দখলটা সত্যিই ভালো। এখন নতুন করে চাপ নেওয়ার দরকার নেই—যেভাবে চলছ সেভাবেই নিয়মিত থাকো, আর মাঝে মাঝে আগের পড়াগুলোয় একটু চোখ বুলিয়ে নিও। এই ছন্দটা ধরে রাখতে পারলে পরীক্ষায় এই বিষয় নিয়ে তোমার আর কোনো চিন্তা থাকবে না।",
    };
  }

  if (percentage >= 80 && percentage <= 89) {
    return {
      category: "প্রায় গুছিয়ে এনেছ",
      comment:
        "তোমার প্রস্তুতি প্রায় ঠিক জায়গায় আছে। শুধু ছোটখাটো ফাঁকগুলো—একটা সূত্র, একটা বানান, কিংবা কোনো প্রশ্ন ঠিকমতো না বোঝা—এখনই ধরে নাও। এই ছোট ভুলগুলোই কিন্তু পরীক্ষায় বড় নম্বর খেয়ে ফেলে, তাই এগুলোকে হালকাভাবে নিও না।",
    };
  }

  if (percentage >= 65 && percentage <= 79) {
    return {
      category: "আর একটু খাটলেই হয়ে যাবে",
      comment:
        "এই বিষয়ে এখনো কিছু জায়গা ফাঁকা রয়ে গেছে। যেসব অধ্যায় কঠিন লাগে সেগুলো বুঝে বুঝে পড়ো, আর যেসব প্রশ্নে ভুল করেছ সেগুলো নিজে হাতে আবার করে দেখো। একটু গুছিয়ে এগোলে অল্প দিনেই উন্নতিটা নিজের চোখেই ধরা পড়বে।",
    };
  }

  if (percentage >= 50 && percentage <= 64) {
    return {
      category: "পড়ার ধরনটা একটু বদলাতে হবে",
      comment:
        "মনে হচ্ছে কিছু টপিক এখনো তোমার কাছে পরিষ্কার হয়নি। শুধু বেশি সময় পড়লেই হবে না—কীভাবে পড়ছ সেটাও দেখা দরকার। বেসিকটা আরেকবার ভালো করে দেখে নাও, আর ঠিক কোথায় আটকে যাচ্ছ সেটা মেন্টরকে বলো; আমরা একসাথে সেটা ঠিক করে দেব।",
    };
  }

  if (percentage >= 30 && percentage <= 49) {
    return {
      category: "এখনো ঘুরে দাঁড়ানোর অনেক সময় আছে",
      comment:
        "ভয় পেয়ো না, এই বিষয়ে এখনো ঘুরে দাঁড়ানোর যথেষ্ট সময় আছে। প্রতিদিন একটু একটু করে নিয়ম করে বসো, আর কোথায় সমস্যা হচ্ছে খোলাখুলি মেন্টরের সাথে কথা বলো। মন দিয়ে লেগে থাকলে এই বিষয়েই তুমি অবাক করার মতো উন্নতি করতে পারো।",
    };
  }

  return {
    category: "চলো, একদম গোড়া থেকে শুরু করি",
    comment:
      "এই বিষয়ে নম্বর অনেকটাই কম এসেছে, তবে এটাকে শেষ ভেবো না—বরং নতুন করে শুরু করার সুযোগ ভাবো। দেরি না করে আজ থেকেই বেসিক ধরো, প্রতিদিন একটা নির্দিষ্ট সময় শুধু এই বিষয়ের জন্য রাখো, আর আটকে গেলেই মেন্টরের কাছে চলে এসো। ধাপে ধাপে এগোলে এখান থেকেও কিন্তু ভালো জায়গায় পৌঁছানো যায়।",
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
    category: "নতুন করে শুরু করার সময় এখনই",
    check: (p) => p.totalPercentage < 30,
    comment:
      "এবারের ফলাফলটা বলছে পড়াশোনাটা আবার নতুন করে গুছিয়ে শুরু করা দরকার। একসাথে সব ধরতে যেও না—বেসিক থেকে ধীরে ধীরে এগোও, প্রতিদিন একটা নির্দিষ্ট সময় বসো, আর যেখানে আটকাবে সেখানেই মেন্টরকে জানাও। বাড়ির কেউ একটু খেয়াল রাখলে আর তুমি লেগে থাকলে আবার ঠিক পথে ফেরা কঠিন কিছু না।",
  },
  {
    id: 1,
    category: "অসাধারণ, এই ছন্দটা ধরে রাখো",
    check: (p) => p.totalPercentage >= 90,
    comment:
      "তুমি দারুণ একটা জায়গায় আছ। এখন তোমার একটাই কাজ—এই ছন্দটা নষ্ট হতে না দেওয়া। নিয়মিত অনুশীলন করো, পরীক্ষার সময় মাথা ঠান্ডা রেখে উত্তর দাও, আর ভালো করছি বলে গা ছেড়ে দিও না। এভাবে চললে সামনে আরও ভালো ফল তোমার জন্যই অপেক্ষা করছে।",
  },
  {
    id: 2,
    category: "ভালো করছ, এবার একটু সাহস বাড়াও",
    check: (p) =>
      p.totalPercentage < 90 &&
      p.totalPercentage > 70 &&
      p.skippedPercentage + 5.0 > p.incorrectPercentage,
    comment:
      "তোমার প্রস্তুতি বেশ ভালো জায়গায় আছে। তবে অনেক প্রশ্ন ছেড়ে দিচ্ছ, মানে জানা জিনিসেও তুমি একটু দ্বিধায় ভুগছ। মডেল টেস্ট দিয়ে, সময় ধরে অনুশীলন করে নিজের ওপর ভরসাটা বাড়াও। জানা প্রশ্নে সাহস করে কলম চালালে এই ছেড়ে দেওয়া প্রশ্নগুলো থেকেই বাড়তি নম্বর চলে আসবে।",
  },
  {
    id: 3,
    category: "ভালো করছ, একটু সাবধানে উত্তর দাও",
    check: (p) =>
      p.totalPercentage < 90 &&
      p.totalPercentage > 70 &&
      p.incorrectPercentage > p.skippedPercentage + 5,
    comment:
      "তুমি ভালোই করছ, শুধু ভুল উত্তরগুলো একটু কমাতে হবে। অনেক সময় তাড়াহুড়ো করে বা প্রশ্ন পুরোটা না পড়ে উত্তর দিলে এই ভুলগুলো হয়। প্রশ্নটা ঠান্ডা মাথায় পড়ো, নিশ্চিত হয়ে তারপর উত্তর দাও—দেখবে নম্বর নিজে থেকেই উঠে যাচ্ছে।",
  },
  {
    id: 4,
    category: "কৌশলটা একটু ঠিক করলেই হবে",
    check: (p) =>
      p.totalPercentage >= 50 &&
      p.totalPercentage <= 70 &&
      p.skippedPercentage + 10 < p.incorrectPercentage,
    comment:
      "তোমার প্রস্তুতি মাঝামাঝি জায়গায়, খারাপ না। এখন দরকার ভুলগুলো ধরে ফেলা—কোন অধ্যায়ে বা কোন ধরনের প্রশ্নে বারবার আটকাচ্ছ সেটা খুঁজে বের করো। সেই জায়গাগুলো আলাদা করে অনুশীলন করো আর মেন্টরের পরামর্শ মতো এগোও, ফল দ্রুত ভালো হবে।",
  },
  {
    id: 5,
    category: "নিজের ওপর ভরসা রাখলেই এগিয়ে যাবে",
    check: (p) =>
      p.totalPercentage >= 50 &&
      p.totalPercentage <= 70 &&
      p.skippedPercentage + 5 > p.incorrectPercentage,
    comment:
      "তুমি বেশ কিছু প্রশ্ন ছেড়ে দিচ্ছ, অথচ চেষ্টা করলে হয়তো অনেকগুলোরই উত্তর দিতে পারতে। আত্মবিশ্বাসটা একটু বাড়াও—প্রতিদিন ছোট ছোট টেস্ট দাও, সহজ প্রশ্ন থেকে শুরু করে আস্তে আস্তে কঠিনে যাও। নিজের ওপর ভরসা এলেই দেখবে ছেড়ে দেওয়া প্রশ্নেও হাত দিচ্ছ।",
  },
  {
    id: 6,
    category: "পড়ার পদ্ধতিটা গুছিয়ে নিতে হবে",
    check: (p) =>
      p.totalPercentage >= 30 &&
      p.totalPercentage <= 50 &&
      p.skippedPercentage + 5 < p.incorrectPercentage,
    comment:
      "তোমার পড়াটা আরেকটু গুছিয়ে করা দরকার। এখন বেশ ভুল হচ্ছে, তাই আগে বেসিক ধারণাগুলো পরিষ্কার করো, তারপর অধ্যায় ধরে ধরে অনুশীলন করো। মেন্টরের সাথে বসে পড়ার ধরনটা একটু বদলে নাও, আর ভুলগুলো নিয়ম করে আবার দেখো—উন্নতি আসবেই।",
  },
  {
    id: 7,
    category: "চর্চা আর সাহস—দুটোই বাড়ানোর সময়",
    check: (p) =>
      p.totalPercentage >= 30 &&
      p.totalPercentage <= 50 &&
      p.skippedPercentage + 5 > p.incorrectPercentage,
    comment:
      "তুমি অনেক প্রশ্ন ছেড়ে দিচ্ছ, যেটা ঠিক হচ্ছে না। নিজের প্রস্তুতির ওপর একটু আস্থা রাখো—সব না পারলেও যেগুলো পারো অন্তত সেগুলো করার চেষ্টা করো। ছোট লক্ষ্য নিয়ে প্রতিদিন পড়ো, সহজ প্রশ্ন আগে ধরো, আর সমস্যা হলে মেন্টরকে বলো; আস্তে আস্তে সব ঠিক হয়ে যাবে।",
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
];

function normalizeSubjectName(name) {
  return String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getSubjectsByNames(subjects, allowedNames) {
  const allowed = allowedNames.map(normalizeSubjectName);
  const selected = {};

  Object.entries(subjects || {}).forEach(([subjectName, value]) => {
    if (allowed.includes(normalizeSubjectName(subjectName))) {
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
      : "তোমার ফলাফলটা ঠিক কোন ছকে ফেলব বোঝা যাচ্ছে না। তাই বিষয়ভিত্তিক নম্বরগুলো নিয়ে একবার মেন্টরের সাথে বসো—কোথায় ভালো আর কোথায় খামতি দেখে সামনের পরিকল্পনাটা একসাথে ঠিক করে নেব।",
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
        "Science আর General দুই দিকেই তোমার অবস্থা প্রায় কাছাকাছি, এটা খুব ভালো লক্ষণ। যেদিকটায় নম্বর সামান্য কম এসেছে, সেখানে একটু বেশি রিভিশন দিলেই সব মিলিয়ে ফলটা আরও সুন্দর দেখাবে।",
    };
  }

  if (deviation <= 30) {
    if (weakerPart === "science") {
      return {
        deviation,
        weakerPart,
        category: "Science-এ একটু বেশি সময় দাও",
        comment:
          "General-এর তুলনায় Science-এ তুমি একটু পিছিয়ে আছ। Physics, Chemistry, Math, Biology—এগুলো মুখস্থ না করে বুঝে পড়ো আর নিয়মিত অঙ্ক ও সমস্যা মেলাও। একটু বাড়তি সময় দিলেই এই দিকটা সামলে যাবে।",
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
        "Science-এ পার্থক্যটা বেশ বড়। ঘাবড়ে না গিয়ে গোড়া থেকে ধরো—বেসিক কনসেপ্ট আর সূত্রগুলো ভালো করে বুঝে নাও, মেন্টরের সাহায্য নিয়ে নিয়মিত অনুশীলন করো। ঠিকভাবে শুরু করলে এই দূরত্বটা ধীরে ধীরে মিটে যাবে।",
    };
  }

  return {
    deviation,
    weakerPart,
    category: "General বিষয়গুলোতে নিয়মিত পড়া দরকার",
    comment:
      "General বিষয়গুলোতে অনেকটাই পিছিয়ে আছ। এই বিষয়গুলোতে নিয়মিত পড়া, লেখা আর রিভিশনের কোনো বিকল্প নেই। প্রতিদিন একটা নির্দিষ্ট সময় এগুলোর জন্য রাখো—অল্প দিনেই নম্বর উঠতে শুরু করবে।",
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
      comment:
        "বিষয়ভিত্তিক হিসাব করার মতো যথেষ্ট তথ্য এখানে নেই।",
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
      "সব মিলিয়ে তুমি ভালো পথেই আছ। এই জায়গাটা ধরে রাখতে নিয়মিত অনুশীলন আর রিভিশন চালিয়ে যাও। ভালো ফলের মধ্যেও একটু খেয়াল করো—কোন অংশে তুমি সবচেয়ে শক্তিশালী আর কোথায় আর একটু নজর দিলে ফলটা আরও ঝকঝকে হবে।";
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
  const percentageData = calculatePercentages(subjects);
  const overallComment = getInitialComment(percentageData);

  const scienceAnalysis = generatePartitionAnalysis(
    "Science",
    getSubjectsByNames(subjects, scienceSubjects)
  );

  const generalAnalysis = generatePartitionAnalysis(
    "General",
    getSubjectsByNames(subjects, generalSubjects)
  );

  return {
    ...percentageData,
    ...overallComment,

    subjectConsistency: generateSubjectConsistencyAnalysis(subjects),

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
};