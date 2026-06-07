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
      category: "খুব ভালো অবস্থানে আছে",
      comment:
        "এই বিষয়ে শিক্ষার্থী খুব ভালো অবস্থানে আছে। বর্তমান প্রস্তুতি ও ধারাবাহিকতা ধরে রাখাই এখন সবচেয়ে গুরুত্বপূর্ণ। একইভাবে নিয়মিত অনুশীলন ও রিভিশন চালিয়ে গেলে এই বিষয়ে ভালো ফলাফল ধরে রাখা সম্ভব হবে।",
    };
  }

  if (percentage >= 80 && percentage <= 89) {
    return {
      category: "ভালো পথে আছে",
      comment:
        "এই বিষয়ে শিক্ষার্থী ভালো পথে আছে এবং প্রস্তুতি মোটামুটি লাইনে আছে। তবে ছোট কোনো অধ্যায়, সূত্র, বানান, ব্যাখ্যা বা প্রশ্ন বোঝার জায়গায় যদি সামান্য দুর্বলতা থাকে, সেটি এখনই ঠিক করা ভালো। কারণ ছোট জায়গার ভুল পরে বড় নম্বর কমিয়ে দিতে পারে।",
    };
  }

  if (percentage >= 65 && percentage <= 79) {
    return {
      category: "আরও ফোকাস দিলে ভালো উন্নতি হবে",
      comment:
        "এই বিষয়ে প্রস্তুতি এখনো পুরোপুরি সম্পন্ন হয়নি। কিছু অধ্যায় বা টপিক আরও ভালোভাবে বুঝে পড়া দরকার হতে পারে। নিয়মিত রিভিশন, অধ্যায়ভিত্তিক অনুশীলন এবং ভুল হওয়া প্রশ্নগুলো আবার করলে এই বিষয়ে দ্রুত উন্নতি করা সম্ভব।",
    };
  }

  if (percentage >= 50 && percentage <= 64) {
    return {
      category: "বুঝে পড়ার পদ্ধতি আরও শক্ত করা দরকার",
      comment:
        "এই বিষয়ে শিক্ষার্থী হয়তো কিছু টপিক বুঝতে কষ্ট পাচ্ছে। তাই শুধু বেশি পড়লেই হবে না, কীভাবে পড়ছে সেটিও দেখা দরকার। মেন্টরের পরামর্শ নিয়ে পড়ার পদ্ধতি একটু পরিবর্তন করা, বেসিক বিষয়গুলো আবার দেখা এবং কোন জায়গায় সমস্যা হচ্ছে তা খুঁজে বের করলে ভালো উন্নতি হবে।",
    };
  }

  if (percentage >= 30 && percentage <= 49) {
    return {
      category: "এখনো উন্নতির ভালো সুযোগ আছে",
      comment:
        "এই বিষয়ে এখনো উন্নতির সময় আছে। শিক্ষার্থী যদি নিয়মিত ও আন্তরিকভাবে পড়াশোনা শুরু করে, তাহলে মেন্টররা তাকে সঠিকভাবে সাহায্য করতে পারবেন। কোন অধ্যায় বুঝতে সমস্যা হচ্ছে, কোথায় ভুল হচ্ছে এবং কীভাবে পড়লে ভালো হবে—এসব বিষয় অভিজ্ঞ শিক্ষক বা মেন্টরের সাথে আলোচনা করা দরকার।",
    };
  }

  return {
    category: "এখন থেকেই বিশেষ মনোযোগ দরকার",
    comment:
      "এই বিষয়ে ফলাফল অনেক কম এসেছে, তাই এখন থেকেই পড়াশোনায় বিশেষ মনোযোগ দেওয়া দরকার। দেরি না করে প্রতিদিন নির্দিষ্ট সময় এই বিষয়ে পড়া, বেসিক থেকে শুরু করা এবং কোনো সমস্যা হলে মেন্টরের সাহায্য নেওয়া উচিত। সঠিক গাইডলাইন ও নিয়মিত চেষ্টায় এখনো ধীরে ধীরে উন্নতি করা সম্ভব।",
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
    category: "নতুনভাবে শুরু করার ভালো সময়",
    check: (p) => p.totalPercentage < 30,
    comment:
      "শিক্ষার্থীর বর্তমান ফলাফল দেখে বোঝা যাচ্ছে এখন পড়াশোনাকে নতুনভাবে গুছিয়ে শুরু করার সময়। বেসিক বিষয়গুলো ধীরে ধীরে পরিষ্কার করা, প্রতিদিন নির্দিষ্ট সময় পড়া এবং মেন্টরের সাথে নিয়মিত যোগাযোগ রাখলে উন্নতির ভালো সুযোগ আছে। পরিবার থেকে উৎসাহ ও নিয়মিত নজরদারি থাকলে শিক্ষার্থী আবার পড়াশোনার সাথে ভালোভাবে যুক্ত হতে পারবে।",
  },
  {
    id: 1,
    category: "খুব ভালো অবস্থানে আছে",
    check: (p) => p.totalPercentage >= 90,
    comment:
      "শিক্ষার্থী খুব ভালো অবস্থানে আছে। এই ধারাবাহিকতা ধরে রাখতে নিয়মিত অনুশীলন, রিভিশন এবং পরীক্ষার সময় মনোযোগ বজায় রাখা প্রয়োজন। একইভাবে এগিয়ে গেলে সামনে আরও ভালো ফলাফল করার সম্ভাবনা রয়েছে।",
  },
  {
    id: 2,
    category: "ভালো, আত্মবিশ্বাস আরও বাড়ালে ফল আরও ভালো হবে",
    check: (p) =>
      p.totalPercentage < 90 &&
      p.totalPercentage > 70 &&
      p.skippedPercentage + 5.0 > p.incorrectPercentage,
    comment:
      "শিক্ষার্থীর প্রস্তুতি ভালো পর্যায়ে আছে। কিছু প্রশ্ন স্কিপ করা থেকে বোঝা যায়, জানা বিষয়েও আরও আত্মবিশ্বাস নিয়ে উত্তর করার অভ্যাস তৈরি করলে ফলাফল আরও ভালো হতে পারে। নিয়মিত মডেল টেস্ট, সময় ধরে অনুশীলন এবং জানা প্রশ্নে সাহস নিয়ে উত্তর করার চর্চা করলে স্কিপ করা প্রশ্নগুলো থেকেও নম্বর পাওয়া সম্ভব হবে।",
  },
  {
    id: 3,
    category: "ভালো, উত্তর করার সময় আরও মনোযোগ দরকার",
    check: (p) =>
      p.totalPercentage < 90 &&
      p.totalPercentage > 70 &&
      p.incorrectPercentage > p.skippedPercentage + 5,
    comment:
      "শিক্ষার্থী ভালো করছে। তবে কিছু ভুল উত্তর কমাতে পারলে ফলাফল আরও স্থিতিশীল হবে। প্রশ্ন ভালোভাবে পড়ে, তাড়াহুড়া না করে এবং নিশ্চিত হয়ে উত্তর করার অভ্যাস তৈরি করলে নম্বর আরও বাড়বে।",
  },
  {
    id: 4,
    category: "কৌশল ঠিক করলে ভালো উন্নতি হবে",
    check: (p) =>
      p.totalPercentage >= 50 &&
      p.totalPercentage <= 70 &&
      p.skippedPercentage + 10 < p.incorrectPercentage,
    comment:
      "শিক্ষার্থীর প্রস্তুতি মাঝামাঝি পর্যায়ে আছে। ভুলের জায়গাগুলো চিহ্নিত করে অধ্যায়ভিত্তিক অনুশীলন করলে ভালো উন্নতি সম্ভব। কোন অধ্যায় বা কোন ধরনের প্রশ্নে বেশি ভুল হচ্ছে তা দেখে মেন্টরের গাইডলাইন অনুযায়ী পড়লে ফলাফল ধীরে ধীরে ভালো হবে।",
  },
  {
    id: 5,
    category: "আত্মবিশ্বাস ও নিয়মিত চর্চা বাড়ালে উন্নতি হবে",
    check: (p) =>
      p.totalPercentage >= 50 &&
      p.totalPercentage <= 70 &&
      p.skippedPercentage + 5 > p.incorrectPercentage,
    comment:
      "শিক্ষার্থী কিছু প্রশ্ন স্কিপ করছে। যদি আত্মবিশ্বাস আরও বাড়ে, তাহলে জানা প্রশ্নগুলোতেও উত্তর করার সাহস পাবে এবং নম্বর বাড়ানো সম্ভব হবে। প্রতিদিন ছোট ছোট টেস্ট, নিয়মিত রিভিশন এবং সহজ প্রশ্ন থেকে শুরু করে ধীরে ধীরে কঠিন প্রশ্ন অনুশীলন করলে ভালো উন্নতি হবে।",
  },
  {
    id: 6,
    category: "পড়ার পদ্ধতি আরও কার্যকর করা দরকার",
    check: (p) =>
      p.totalPercentage >= 30 &&
      p.totalPercentage <= 50 &&
      p.skippedPercentage + 5 < p.incorrectPercentage,
    comment:
      "শিক্ষার্থীর পড়াশোনায় আরও গুছানো পদ্ধতি দরকার। ভুল উত্তর কমাতে আগে বেসিক ধারণা পরিষ্কার করা, তারপর অধ্যায়ভিত্তিক অনুশীলন করা ভালো হবে। মেন্টরের পরামর্শ নিয়ে পড়ার ধরন একটু পরিবর্তন করলে এবং নিয়মিত ভুলগুলো রিভিউ করলে উন্নতির সুযোগ আছে।",
  },
  {
    id: 7,
    category: "নিয়মিত চর্চা ও আত্মবিশ্বাস বাড়ানোর সময়",
    check: (p) =>
      p.totalPercentage >= 30 &&
      p.totalPercentage <= 50 &&
      p.skippedPercentage + 5 > p.incorrectPercentage,
    comment:
      "স্কিপ করা প্রশ্নের সংখ্যা কিছুটা বেশি। শিক্ষার্থী যদি নিজের প্রস্তুতির ওপর আরও আত্মবিশ্বাস তৈরি করতে পারে, তাহলে অনেক স্কিপ করা প্রশ্নেও উত্তর করার চেষ্টা করতে পারবে। ছোট লক্ষ্য নিয়ে প্রতিদিন পড়া, সহজ প্রশ্ন আগে অনুশীলন করা এবং মেন্টরের সাথে সমস্যা আলোচনা করলে ধীরে ধীরে ভালো উন্নতি হবে।",
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

const nonScienceSubjects = [
  "Bangla 1st",
  "Bangla 2nd",
  "English 1st",
  "English 2nd",
  "Religion",
  "ICT",
];

const mathematicalSubjects = [
  "Physics",
  "Chemistry",
  "General Math",
  "Higher Math",
  "Physics 1st",
  "Physics 2nd",
  "Chemistry 1st",
  "Chemistry 2nd",
  "Higher Math 1st",
  "Higher Math 2nd",
];

const nonMathematicalSubjects = [
  "Bangla 1st",
  "Bangla 2nd",
  "English 1st",
  "English 2nd",
  "Religion",
  "ICT",
  "Biology",
  "BGS",
  "Biology 1st",
  "Biology 2nd",
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
    category: matchedRule ? matchedRule.category : "মেন্টরের পরামর্শ প্রয়োজন",
    comment: matchedRule
      ? matchedRule.comment
      : "ফলাফলটি নির্দিষ্ট কোনো ক্যাটাগরিতে পড়ছে না। তাই বিষয়ভিত্তিক ফলাফল দেখে মেন্টরের সাথে আলোচনা করে পরবর্তী প্রস্তুতির পরিকল্পনা করা ভালো হবে।",
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

function generateScienceComparisonComment(scienceData, nonScienceData) {
  const sciencePercent = scienceData.totalPercentage || 0;
  const nonSciencePercent = nonScienceData.totalPercentage || 0;
  const deviation = Number(Math.abs(sciencePercent - nonSciencePercent).toFixed(2));

  const weakerPart =
    sciencePercent < nonSciencePercent
      ? "science"
      : nonSciencePercent < sciencePercent
      ? "nonScience"
      : "equal";

  if (deviation < 15) {
    return {
      deviation,
      weakerPart,
      category: "Science ও Non-Science পারফরম্যান্স কাছাকাছি",
      comment:
        "Science এবং Non-Science দুই অংশের পারফরম্যান্স কাছাকাছি আছে। এটি ভালো ভারসাম্যের লক্ষণ। যে অংশে সামান্য কম নম্বর এসেছে, সেখানে একটু বেশি রিভিশন দিলে সামগ্রিক ফলাফল আরও সুন্দর হবে।",
    };
  }

  if (deviation <= 30) {
    if (weakerPart === "science") {
      return {
        deviation,
        weakerPart,
        category: "Science অংশে একটু বেশি সময় দিলে উন্নতি হবে",
        comment:
          "Science অংশে তুলনামূলকভাবে আরও মনোযোগ দিলে ভালো উন্নতি সম্ভব। Physics, Chemistry, Math ও Biology বুঝে পড়া এবং নিয়মিত সমস্যা সমাধান করলে এই অংশের ফলাফল আরও ভালো হবে।",
      };
    }

    return {
      deviation,
      weakerPart,
      category: "Non-Science অংশে রিভিশন বাড়ালে ভালো হবে",
      comment:
        "Non-Science অংশে তুলনামূলকভাবে আরও রিভিশন দরকার। Bangla, English, Religion ও ICT সহজ মনে হলেও নিয়মিত না পড়লে নম্বর কমে যেতে পারে। প্রতিদিন অল্প সময় রিভিশন করলে এই অংশে ভালো উন্নতি হবে।",
    };
  }

  if (weakerPart === "science") {
    return {
      deviation,
      weakerPart,
      category: "Science অংশের বেসিক আরও শক্ত করা দরকার",
      comment:
        "Science অংশে পার্থক্য বেশি দেখা যাচ্ছে। তাই বেসিক ধারণা পরিষ্কার করা, সূত্র ও কনসেপ্ট বুঝে পড়া এবং মেন্টরের গাইডলাইন অনুযায়ী নিয়মিত অনুশীলন করা দরকার। সঠিকভাবে শুরু করলে ধীরে ধীরে ভালো উন্নতি সম্ভব।",
    };
  }

  return {
    deviation,
    weakerPart,
    category: "Non-Science অংশে নিয়মিত পড়া দরকার",
    comment:
      "Non-Science অংশে পার্থক্য বেশি দেখা যাচ্ছে। এই বিষয়গুলোতে নিয়মিত পড়া, লেখা, মুখস্থ ও রিভিশন দরকার। প্রতিদিন নির্দিষ্ট সময় দিলে এই অংশের ফলাফল ভালোভাবে উন্নত করা সম্ভব।",
  };
}

function generateMathComparisonComment(mathData, nonMathData) {
  const mathPercent = mathData.totalPercentage || 0;
  const nonMathPercent = nonMathData.totalPercentage || 0;
  const deviation = Number(Math.abs(mathPercent - nonMathPercent).toFixed(2));

  const weakerPart =
    mathPercent < nonMathPercent
      ? "math"
      : nonMathPercent < mathPercent
      ? "nonMath"
      : "equal";

  if (deviation < 10) {
    return {
      deviation,
      weakerPart,
      category: "Mathematical ও Non-Mathematical ভারসাম্য ভালো",
      comment:
        "Mathematical এবং Non-Mathematical দুই অংশের পারফরম্যান্স কাছাকাছি। এটি ভালো ভারসাম্যের ইঙ্গিত দেয়। নিয়মিত অনুশীলন ও রিভিশন বজায় রাখলে দুই অংশেই আরও ভালো ফলাফল করা সম্ভব।",
    };
  }

  if (deviation <= 30) {
    if (weakerPart === "math") {
      return {
        deviation,
        weakerPart,
        category: "Mathematical অংশে অনুশীলন বাড়ানো দরকার",
        comment:
          "Mathematical অংশে আরও অনুশীলন করলে ভালো উন্নতি হবে। Math, Physics ও Chemistry-এর সমস্যা নিয়মিত সমাধান করলে কোথায় সমস্যা হচ্ছে তা বোঝা যাবে এবং ধীরে ধীরে নম্বর বাড়বে।",
      };
    }

    return {
      deviation,
      weakerPart,
      category: "Non-Mathematical অংশে রিভিশন দরকার",
      comment:
        "Mathematical অংশ তুলনামূলকভাবে ভালো হলেও Non-Mathematical অংশে আরও রিভিশন দরকার। Bangla, English, Religion, ICT ও Biology ধরনের বিষয়গুলো নিয়মিত পড়া এবং মনে রাখার অনুশীলন করলে ফলাফল ভালো হবে।",
    };
  }

  if (weakerPart === "math") {
    return {
      deviation,
      weakerPart,
      category: "Mathematical অংশের বেসিক শক্ত করা দরকার",
      comment:
        "Mathematical অংশে আরও বেশি মনোযোগ দরকার। নিয়মিত সমস্যা সমাধান, বেসিক ধারণা পরিষ্কার করা এবং মেন্টরের গাইডলাইন নিয়ে প্রস্তুতি চালালে ভালো উন্নতি সম্ভব।",
    };
  }

  return {
    deviation,
    weakerPart,
    category: "Non-Mathematical অংশে নিয়মিত রিভিশন দরকার",
    comment:
      "Non-Mathematical অংশে পার্থক্য বেশি দেখা যাচ্ছে। এসব বিষয়ে বোঝা, মুখস্থ, লেখা এবং নিয়মিত রিভিশন খুব গুরুত্বপূর্ণ। প্রতিদিন নির্দিষ্ট সময় পড়লে এই অংশের ফলাফল উন্নত করা সম্ভব।",
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
      level: "ডেটা পাওয়া যায়নি",
      comment:
        "বিষয়ভিত্তিক পারফরম্যান্স বিশ্লেষণের জন্য পর্যাপ্ত তথ্য পাওয়া যায়নি।",
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
    level = "পড়াশোনার সাথে নিয়মিত সংযোগ তৈরি করা দরকার";

    comment =
      "বেশিরভাগ বিষয়ে ফলাফল কম এসেছে। হঠাৎ কোনো একটি বিষয়ে ভালো বা খারাপ ফলাফল বাদ দিলেও সামগ্রিকভাবে বোঝা যাচ্ছে, শিক্ষার্থীর পড়াশোনার সাথে নিয়মিত সংযোগ আরও শক্ত করা দরকার। প্রতিদিন নির্দিষ্ট সময় পড়া, ছোট ছোট অধ্যায়ভিত্তিক লক্ষ্য ঠিক করা এবং মেন্টরের পর্যবেক্ষণে এগোলে ধীরে ধীরে ভালো উন্নতি সম্ভব।";
  } else if (averagePercentage < 70) {
    level = "মাঝারি পর্যায়ের প্রস্তুতি";

    comment =
      "শিক্ষার্থীর ফলাফল মাঝারি পর্যায়ে আছে। এখন বেশি সময়, নিয়মিত অনুশীলন এবং তুলনামূলক কম নম্বর পাওয়া বিষয়গুলোতে আলাদা ফোকাস দরকার। এই পর্যায়ে Cluster Analysis বেশি গুরুত্বপূর্ণ, কারণ কোন গ্রুপে ভালো করছে এবং কোন জায়গায় নম্বর হারাচ্ছে তা দেখে প্রস্তুতির দিক ঠিক করা যাবে।";
  } else {
    level = "ভালো পথে আছে";

    comment =
      "শিক্ষার্থী সামগ্রিকভাবে ভালো পথে আছে। এই অবস্থান ধরে রাখতে নিয়মিত অনুশীলন ও রিভিশন চালিয়ে যেতে হবে। তবে ভালো ফলাফলের মধ্যেও Cluster Analysis দেখে বোঝা জরুরি কোন অংশে শক্তিশালী এবং কোন অংশে আরও একটু ফোকাস দিলে ফলাফল আরও ভালো হবে।";
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

  const nonScienceAnalysis = generatePartitionAnalysis(
    "Non-Science",
    getSubjectsByNames(subjects, nonScienceSubjects)
  );

  const mathematicalAnalysis = generatePartitionAnalysis(
    "Mathematical",
    getSubjectsByNames(subjects, mathematicalSubjects)
  );

  const nonMathematicalAnalysis = generatePartitionAnalysis(
    "Non-Mathematical",
    getSubjectsByNames(subjects, nonMathematicalSubjects)
  );

  return {
    ...percentageData,
    ...overallComment,

    subjectConsistency: generateSubjectConsistencyAnalysis(subjects),

    partitions: {
      science: scienceAnalysis,
      nonScience: nonScienceAnalysis,
      comparison: generateScienceComparisonComment(
        scienceAnalysis,
        nonScienceAnalysis
      ),
    },

    mathPartitions: {
      mathematical: mathematicalAnalysis,
      nonMathematical: nonMathematicalAnalysis,
      comparison: generateMathComparisonComment(
        mathematicalAnalysis,
        nonMathematicalAnalysis
      ),
    },
  };
}

module.exports = {
  generateStudentAnalysis,
  commentRules,
  getSubjectWiseComment,
};