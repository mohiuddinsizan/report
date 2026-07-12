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

  function getRandomComment(comments) {
    const randomIndex = Math.floor(Math.random() * comments.length);
    return comments[randomIndex];
  }

  let category;
  let comments;

  if (percentage >= 90) {
    category = "প্রস্তুতি অত্যন্ত ভালো পর্যায়ে রয়েছে";

    comments = [
      "এই বিষয়ে তোমার প্রস্তুতি অত্যন্ত সন্তোষজনক। গুরুত্বপূর্ণ টপিক গুলো তুমি ভালোভাবে আয়ত্ত করতে পেরেছো। এই অবস্থান ধরে রাখতে নিয়মিত অনুশীলন ও পুনরাবৃত্তি চালিয়ে যাও।",

      "এই বিষয়ে তোমার পারফরম্যান্স প্রশংসনীয়। প্রশ্ন বোঝা ও সঠিকভাবে সমাধান করার দক্ষতা ভালো পর্যায়ে রয়েছে। এখন ছোটখাটো ভুলগুলো কমানো এবং প্রস্তুতির ধারাবাহিকতা বজায় রাখাই মূল লক্ষ্য হওয়া উচিত।",

      "তুমি এই বিষয়ে খুব ভালো প্রস্তুতি নিয়েছো। অধিকাংশ প্রশ্নে তোমার ধারণার স্পষ্টতা দেখা গেছে। নিয়মিত রিভিশন এবং নির্ধারিত সময়ে অনুশীলন করলে এই ভালো ফলাফল ধরে রাখতে পারবে।",

      "এই বিষয়ের উপর তোমার নিয়ন্ত্রণ বেশ ভালো। প্রস্তুতির বর্তমান ধারা ঠিক রেখে যেসব প্রশ্নে সামান্য ভুল হয়েছে, সেগুলো আবার দেখে নাও। এতে তোমার প্রস্তুতি আরও নির্ভুল হবে।",

      "এই বিষয়ে তোমার অবস্থান খুবই ভালো। শেখা বিষয়গুলো নিয়মিত ঝালিয়ে নাও এবং পরীক্ষায় সময় ব্যবস্থাপনার দিকে মনোযোগ দাও। এতে ভবিষ্যতের পরীক্ষাগুলোতেও ভালো ফলাফল বজায় থাকবে।",
    ];
  } else if (percentage >= 80) {
    category = "প্রস্তুতি সঠিক পথেই রয়েছে";

    comments = [
      "এই বিষয়ে তুমি ভালো করেছো এবং তোমার প্রস্তুতি সঠিক পথেই রয়েছে। যেসব জায়গায় ভুল হয়েছে, সেগুলো চিহ্নিত করে নিয়মিত অনুশীলন করলে ফলাফল আরও ভালো হবে।",

      "তোমার বিষয়ভিত্তিক ধারণা ভালো পর্যায়ে রয়েছে। তবে কিছু নির্দিষ্ট অংশে আরও মনোযোগ দেওয়া প্রয়োজন। ভুল হওয়া প্রশ্নগুলো পুনরায় সমাধান করে প্রস্তুতিটা আরও শক্ত করো।",

      "এই বিষয়ে তোমার পারফরম্যান্স সন্তোষজনক। আরেকটু নিয়মিত অনুশীলন এবং ভুলগুলোর কারণ বিশ্লেষণ করলে খুব ভালো পর্যায়ে পৌঁছানো সম্ভব। প্রয়োজন হলে মেন্টরের কাছ থেকে নির্দিষ্ট সমস্যাগুলোর সমাধান বুঝে নাও।",

      "তুমি ভালো প্রস্তুতি নিয়েছো, তবে আরও উন্নতির সুযোগ রয়েছে। যে অধ্যায় বা প্রশ্নের ধরনে ভুল বেশি হয়েছে, সেখানে বাড়তি সময় দিয়ে অনুশীলন করো।",

      "এই বিষয়ে তোমার অগ্রগতি ভালো। এখন মূল কাজ হলো অসতর্কতাজনিত ভুল কমানো এবং দুর্বল অংশগুলো নিয়মিত পুনরাবৃত্তি করা। পরিকল্পনা অনুযায়ী এগোলে ফলাফল আরও উন্নত হবে।",
    ];
  } else if (percentage >= 65) {
    category = "ভালো প্রস্তুতির জন্য পরিশ্রম আরও বাড়াতে হবে";

    comments = [
      "এই বিষয়ে তোমার মৌলিক প্রস্তুতি আছে, তবে কিছু গুরুত্বপূর্ণ জায়গায় ঘাটতি রয়েছে। ভুল হওয়া প্রশ্নগুলো চিহ্নিত করে সংশ্লিষ্ট অধ্যায় আবার পড়ো এবং নিয়মিত অনুশীলন করো।",

      "তোমার প্রস্তুতি মাঝারি থেকে ভালো পর্যায়ে রয়েছে। আরও ভালো করতে হলে দুর্বল টপিকগুলো আলাদা করে নির্ধারণ করে সেগুলোর উপর পরিকল্পিতভাবে কাজ করতে হবে।",

      "এই বিষয়ে তুমি অনেক প্রশ্ন সঠিকভাবে করতে পেরেছো, তবে কয়েকটি গুরুত্বপূর্ণ ধারণা আরও পরিষ্কার করা প্রয়োজন। সমস্যা বুঝতে অসুবিধা হলে মেন্টরের সাহায্য নিয়ে বিষয়গুলো ভালোভাবে বুঝে নাও।",

      "তোমার প্রস্তুতিতে অগ্রগতি রয়েছে, কিন্তু এখনো কিছু ঘাটতি পূরণ করা দরকার। প্রতিদিন নির্দিষ্ট সময় অনুশীলন এবং ভুল প্রশ্ন পুনরায় সমাধান করলে দ্রুত উন্নতি করতে পারবে।",

      "এই ফলাফল দেখাচ্ছে যে তুমি বিষয়টি বুঝতে পারছো, তবে প্রয়োগের ক্ষেত্রে আরও অনুশীলন প্রয়োজন। কোন ধরনের প্রশ্নে বেশি ভুল হচ্ছে তা খুঁজে বের করে সেই অনুযায়ী প্রস্তুতি নাও।",
    ];
  } else if (percentage >= 50) {
    category = "প্রস্তুতির ধরনে কিছু পরিবর্তন প্রয়োজন";

    comments = [
      "এই বিষয়ে তোমার প্রস্তুতিতে বেশ কিছু ঘাটতি রয়েছে। শুধু পড়া শেষ করার পরিবর্তে প্রতিটি ধারণা বুঝে প্রশ্ন সমাধানের অভ্যাস তৈরি করো। ভুল প্রশ্নগুলো নিয়মিত পুনরায় অনুশীলন করতে হবে।",

      "তোমার বর্তমান প্রস্তুতির পদ্ধতিতে কিছু পরিবর্তন আনা প্রয়োজন। দুর্বল অধ্যায়গুলো চিহ্নিত করে ছোট ছোট অংশে ভাগ করে পড়ো এবং প্রতিটি অংশ শেষে নিজেকে যাচাই করো।",

      "এই বিষয়ে আরও ভালো করতে হলে নিয়মিত পড়াশোনার পাশাপাশি প্রশ্ন অনুশীলনের পরিমাণ বাড়াতে হবে। কোথায় এবং কেন ভুল হচ্ছে, তা বুঝে সংশোধন করার চেষ্টা করো।",

      "তোমার কিছু ধারণা পরিষ্কার থাকলেও অনেক জায়গায় অনুশীলনের ঘাটতি দেখা যাচ্ছে। একটি নির্দিষ্ট পড়ার পরিকল্পনা তৈরি করে নিয়মিত অনুসরণ করো এবং প্রয়োজন হলে মেন্টরের নির্দেশনা নাও।",

      "এই ফলাফল থেকে বোঝা যাচ্ছে, বিষয়টির কয়েকটি গুরুত্বপূর্ণ অংশ আবার ভালোভাবে শেখা প্রয়োজন। মূল ধারণাগুলো পরিষ্কার করে ধাপে ধাপে সহজ থেকে কঠিন প্রশ্ন অনুশীলন করো।",
    ];
  } else if (percentage >= 30) {
    category = "প্রস্তুতি নতুনভাবে গুছিয়ে নিতে হবে";

    comments = [
      "এই বিষয়ে তোমার প্রস্তুতি প্রত্যাশিত পর্যায়ে পৌঁছায়নি। তবে নিয়মিত ও পরিকল্পিতভাবে শুরু করলে উন্নতি করা সম্ভব। প্রথমে দুর্বল অধ্যায়গুলো চিহ্নিত করে মৌলিক ধারণা পরিষ্কার করো।",

      "তোমাকে এই বিষয়ের প্রস্তুতি নতুনভাবে গুছিয়ে নিতে হবে। একসঙ্গে বেশি কিছু পড়ার চেষ্টা না করে প্রতিদিন অল্প অল্প করে বুঝে পড়ো এবং শেখা অংশ থেকে প্রশ্ন অনুশীলন করো।",

      "বর্তমান ফলাফল নিয়ে হতাশ হওয়ার প্রয়োজন নেই, তবে এখন থেকেই নিয়মিত কাজ শুরু করতে হবে। মৌলিক বিষয়গুলো আবার পড়ো এবং যেসব জায়গায় সমস্যা হচ্ছে, সেগুলো মেন্টরের সাহায্যে সমাধান করো।",

      "এই বিষয়ে ভালো করতে হলে পড়াশোনায় আরও সময় ও মনোযোগ দিতে হবে। সহজ অধ্যায় থেকে শুরু করে ধাপে ধাপে এগিয়ে যাও এবং প্রতিদিনের পড়া নিয়মিত যাচাই করো।",

      "তোমার প্রস্তুতিতে বেশ কিছু ঘাটতি রয়েছে। একটি বাস্তবসম্মত পড়ার রুটিন তৈরি করো, নিয়মিত অনুশীলন করো এবং প্রতিটি পরীক্ষার ভুল থেকে শেখার চেষ্টা করো।",
    ];
  } else {
    category = "প্রস্তুতি নতুনভাবে শুরু করতে হবে";

    comments = [
      "এই বিষয়ে তোমার প্রস্তুতি এখনো প্রাথমিক পর্যায়ে রয়েছে। প্রথমে মৌলিক ধারণাগুলো ভালোভাবে বুঝে নাও এবং সহজ প্রশ্ন সমাধানের মাধ্যমে ধীরে ধীরে আত্মবিশ্বাস তৈরি করো।",

      "তোমাকে বিষয়টির একেবারে মৌলিক অংশ থেকে নতুনভাবে শুরু করতে হবে। প্রতিদিন নির্দিষ্ট সময় পড়ো এবং শেখা অংশগুলো মেন্টর বা শিক্ষকের কাছে যাচাই করে নাও।",

      "বর্তমান ফলাফল উন্নত করতে হলে নিয়মিত পড়াশোনার অভ্যাস তৈরি করা জরুরি। ছোট ছোট লক্ষ্য নির্ধারণ করে প্রতিদিন একটি নির্দিষ্ট অংশ সম্পন্ন করার চেষ্টা করো।",

      "এই বিষয়ে তোমার ভিত্তি আরও শক্ত করা প্রয়োজন। আগে মূল ধারণাগুলো পরিষ্কার করো, এরপর সহজ প্রশ্ন থেকে অনুশীলন শুরু করো। না বুঝে কোনো অংশ ফেলে রেখো না।",

      "ফলাফল কম হলেও এখনো ঘুরে দাঁড়ানোর যথেষ্ট সুযোগ রয়েছে। নিয়মিত পরীক্ষায় অংশগ্রহণ করো, না বোঝা বিষয়গুলো দ্রুত জেনে নাও এবং প্রতিদিন অনুশীলনের জন্য সময় রাখো।",
    ];
  }

  return {
    category,
    comment: getRandomComment(comments),
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

function createCommentRule({ id, category, check, comments }) {
  return {
    id,
    category,
    check,

    // আগের মতো rule.comment ব্যবহার করলেই random comment পাওয়া যাবে
    get comment() {
      const randomIndex = Math.floor(Math.random() * comments.length);
      return comments[randomIndex];
    },
  };
}

const commentRules = [
  // ৩০%-এর নিচে
  createCommentRule({
    id: 8,
    category: "প্রস্তুতির ভিত্তি নতুনভাবে গড়ে তুলতে হবে",

    check: (p) => p.totalPercentage < 30,

    comments: [
      "এই ফলাফল থেকে বোঝা যাচ্ছে, বিষয়গুলোর মৌলিক ধারণায় এখনো যথেষ্ট ঘাটতি রয়েছে। শুরু থেকেই একটি নির্দিষ্ট পরিকল্পনা অনুসরণ করে পড়াশোনা করতে হবে। কোথা থেকে শুরু করবে বুঝতে সমস্যা হলে মেন্টরের সঙ্গে কথা বলে একটি কার্যকর পড়ার পরিকল্পনা তৈরি করে নাও।",

      "বর্তমান প্রস্তুতি প্রত্যাশিত পর্যায়ে নেই। তবে এখন থেকেই নিয়মিত পড়াশোনা শুরু করলে ধীরে ধীরে উন্নতি করা সম্ভব। প্রথমে মৌলিক বিষয়গুলো পরিষ্কার করো, এরপর সহজ প্রশ্ন অনুশীলনের মাধ্যমে প্রস্তুতি এগিয়ে নাও।",

      "ভালো ফলাফল করতে হলে পড়াশোনার প্রতি মনোযোগ এবং নিয়মিত অনুশীলন—দুটিই বাড়াতে হবে। যেসব অধ্যায়ে বেশি সমস্যা হচ্ছে, সেগুলো চিহ্নিত করে একেবারে ভিত্তি থেকে পড়া শুরু করো। প্রয়োজন হলে মেন্টরের নির্দেশনা নাও।",

      "এই পর্যায়ে একসঙ্গে অনেক কিছু শেষ করার চেষ্টা না করে ছোট ছোট লক্ষ্য নির্ধারণ করে এগোতে হবে। প্রতিদিনের পড়া প্রতিদিন শেষ করো এবং না বোঝা বিষয়গুলো দ্রুত শিক্ষক বা মেন্টরের কাছ থেকে বুঝে নাও।",
    ],
  }),

  // ৯০% বা তার বেশি
  createCommentRule({
    id: 1,
    category: "প্রস্তুতি অত্যন্ত ভালো পর্যায়ে রয়েছে",

    check: (p) => p.totalPercentage >= 90,

    comments: [
      "তোমার বর্তমান প্রস্তুতি অত্যন্ত সন্তোষজনক। বিষয়গুলোর উপর ভালো নিয়ন্ত্রণ রয়েছে এবং তার প্রতিফলন ফলাফলেও দেখা যাচ্ছে। এই ধারাবাহিকতা বজায় রাখো এবং কোনো অধ্যায়কে হালকাভাবে না নিয়ে নিয়মিত পুনরাবৃত্তি চালিয়ে যাও।",

      "তোমার পারফরম্যান্স প্রশংসনীয়। প্রস্তুতির পদ্ধতি সঠিক রয়েছে, তাই এখন মূল লক্ষ্য হবে এই অবস্থান ধরে রাখা। নিয়মিত মডেল টেস্ট দাও, ভুল প্রশ্নগুলো পর্যালোচনা করো এবং সময় ব্যবস্থাপনার অনুশীলন চালিয়ে যাও।",

      "তুমি খুব ভালোভাবে প্রস্তুতি নিচ্ছো। অধিকাংশ প্রশ্নে তোমার ধারণার স্পষ্টতা এবং যথাযথ অনুশীলনের প্রমাণ পাওয়া গেছে। আত্মতুষ্ট না হয়ে বর্তমান পড়াশোনার ধারা একইভাবে বজায় রাখো।",

      "এই ফলাফল তোমার শক্ত প্রস্তুতির পরিচয় দিচ্ছে। এখন ছোটখাটো ভুল কমানো, নিয়মিত রিভিশন করা এবং পরীক্ষার চাপের মধ্যেও সঠিকভাবে উত্তর দেওয়ার অভ্যাস ধরে রাখার দিকে মনোযোগ দাও।",
    ],
  }),

  // ৭০%-এর বেশি কিন্তু ৯০%-এর নিচে — skipped তুলনামূলক বেশি
  createCommentRule({
    id: 2,
    category:
      "প্রস্তুতি ভালো, তবে আত্মবিশ্বাস ও প্রশ্ন করার হার বাড়াতে হবে",

    check: (p) =>
      p.totalPercentage > 70 &&
      p.totalPercentage < 90 &&
      p.skippedPercentage + 5 >= p.incorrectPercentage,

    comments: [
      "তোমার প্রস্তুতি ভালো পর্যায়ে রয়েছে। তবে পরীক্ষায় বেশ কিছু প্রশ্ন উত্তর না দিয়ে ছেড়ে দেওয়ার প্রবণতা দেখা যাচ্ছে। নিয়মিত অনুশীলনের মাধ্যমে আত্মবিশ্বাস বাড়াও এবং যেসব প্রশ্ন সম্পর্কে ধারণা আছে, সেগুলো যথাযথভাবে চেষ্টা করো।",

      "তুমি সঠিক পথেই এগোচ্ছো এবং বিষয়গুলোর উপর ভালো ধারণাও রয়েছে। তবে প্রশ্ন করার ক্ষেত্রে আরও আত্মবিশ্বাসী হতে হবে। সময়ের অভাবে বা দ্বিধার কারণে কোন ধরনের প্রশ্ন বাদ যাচ্ছে, তা চিহ্নিত করে অনুশীলন করো।",

      "ফলাফল ভালো হলেও আরও উন্নতির সুযোগ রয়েছে। সঠিক উত্তর দেওয়ার দক্ষতা আছে, কিন্তু কিছু প্রশ্ন চেষ্টা না করার কারণে প্রত্যাশিত নম্বর পাওয়া যাচ্ছে না। নির্ধারিত সময়ের মধ্যে বেশি প্রশ্ন সমাধানের অনুশীলন বাড়াও।",

      "তোমার প্রস্তুতির ভিত্তি ভালো। এখন প্রশ্ন এড়িয়ে যাওয়ার কারণগুলো খুঁজে বের করতে হবে। অধ্যায়ভিত্তিক অনুশীলন, নিয়মিত পরীক্ষা এবং সময় ব্যবস্থাপনার মাধ্যমে আত্মবিশ্বাস বাড়ালে ফলাফল আরও ভালো হবে।",
    ],
  }),

  // ৭০%-এর বেশি কিন্তু ৯০%-এর নিচে — incorrect বেশি
  createCommentRule({
    id: 3,
    category:
      "প্রস্তুতি ভালো, তবে উত্তর দেওয়ার ক্ষেত্রে আরও সতর্ক হতে হবে",

    check: (p) =>
      p.totalPercentage > 70 &&
      p.totalPercentage < 90 &&
      p.incorrectPercentage > p.skippedPercentage + 5,

    comments: [
      "তোমার প্রস্তুতি ভালো পর্যায়ে রয়েছে, তবে ভুল উত্তরের সংখ্যা তুলনামূলক বেশি। সব প্রশ্নের উত্তর দেওয়ার চেষ্টা না করে, যে প্রশ্নগুলোর উত্তর সম্পর্কে নিশ্চিত সেগুলো আগে সঠিকভাবে সম্পন্ন করো।",

      "বিষয়গুলোর উপর তোমার ধারণা ভালো, কিন্তু উত্তর দেওয়ার সময় কিছু অসতর্কতা হচ্ছে। প্রশ্ন ভালোভাবে পড়ে, প্রয়োজনীয় হিসাব যাচাই করে এবং উত্তর নির্বাচনের আগে আরেকবার চিন্তা করার অভ্যাস তৈরি করো।",

      "তুমি ভালোভাবে এগিয়ে যাচ্ছো, তবে ভুল উত্তরের কারণে প্রাপ্ত নম্বর কমে যাচ্ছে। কোথায় ধারণাগত ভুল এবং কোথায় অসতর্কতাজনিত ভুল হচ্ছে, তা আলাদাভাবে চিহ্নিত করে সংশোধন করো।",

      "প্রস্তুতি সন্তোষজনক হলেও পরীক্ষার কৌশলে আরও সতর্কতা প্রয়োজন। উত্তর সম্পর্কে নিশ্চিত না হলে অপ্রয়োজনীয় ঝুঁকি না নিয়ে আগে পরিচিত ও নিশ্চিত প্রশ্নগুলো সম্পন্ন করার অভ্যাস করো।",
    ],
  }),

  // ৫০%–৭০% — incorrect তুলনামূলক বেশি
  createCommentRule({
    id: 4,
    category:
      "প্রস্তুতিতে অগ্রগতি আছে, তবে ভুলের হার কমানো জরুরি",

    check: (p) =>
      p.totalPercentage >= 50 &&
      p.totalPercentage <= 70 &&
      p.incorrectPercentage >= p.skippedPercentage + 5,

    comments: [
      "তোমার প্রস্তুতিতে অগ্রগতি রয়েছে, তবে ভুল উত্তরের হার এখনো বেশি। প্রতিটি পরীক্ষার পর ভুল প্রশ্নগুলো আলাদা করে লিখে রাখো এবং কেন ভুল হয়েছে তা বুঝে পুনরায় সমাধান করো।",

      "তুমি অনেক প্রশ্ন চেষ্টা করছো, যা ইতিবাচক। তবে সঠিকভাবে না বুঝে উত্তর দেওয়ার কারণে নম্বর কমে যাচ্ছে। মৌলিক ধারণা পরিষ্কার করে এবং প্রশ্ন ভালোভাবে পড়ে উত্তর দেওয়ার অভ্যাস তৈরি করো।",

      "বর্তমান ফলাফল উন্নত করতে হলে ভুল উত্তরের কারণগুলো গুরুত্ব দিয়ে বিশ্লেষণ করতে হবে। ধারণাগত দুর্বলতা, হিসাবের ভুল এবং অসতর্কতা—কোন কারণে বেশি ভুল হচ্ছে তা চিহ্নিত করে কাজ করো।",

      "প্রস্তুতি আরও ভালো করার সুযোগ রয়েছে। বেশি প্রশ্ন করার পাশাপাশি সঠিক উত্তর দেওয়ার দিকে গুরুত্ব বাড়াতে হবে। নিয়মিত ভুল বিশ্লেষণ করো এবং প্রয়োজন হলে নির্দিষ্ট সমস্যাগুলো মেন্টরের কাছ থেকে বুঝে নাও।",
    ],
  }),

  // ৫০%–৭০% — skipped তুলনামূলক বেশি
  createCommentRule({
    id: 5,
    category:
      "প্রস্তুতি আংশিক সম্পন্ন হয়েছে, নিয়মিত অনুশীলন আরও বাড়াতে হবে",

    check: (p) =>
      p.totalPercentage >= 50 &&
      p.totalPercentage <= 70 &&
      p.incorrectPercentage < p.skippedPercentage + 5,

    comments: [
      "এই ফলাফল থেকে বোঝা যাচ্ছে, প্রস্তুতির কিছু অংশ এখনো অসম্পূর্ণ রয়েছে। যেসব অধ্যায় থেকে বেশি প্রশ্ন বাদ গেছে, সেগুলো চিহ্নিত করে আগে সম্পন্ন করো এবং প্রতিদিন নির্দিষ্ট সংখ্যক প্রশ্ন অনুশীলন করো।",

      "তোমার কিছু বিষয়ে ভালো ধারণা রয়েছে, তবে পুরো সিলেবাসের প্রস্তুতি সমানভাবে সম্পন্ন হয়নি। দুর্বল ও অসম্পূর্ণ অধ্যায়গুলোর জন্য আলাদা সময় নির্ধারণ করে পরিকল্পিতভাবে এগিয়ে যাও।",

      "পরীক্ষায় অনেক প্রশ্ন উত্তর না দিয়ে ছেড়ে দেওয়া হয়েছে। এর কারণ প্রস্তুতির ঘাটতি, সময়ের সমস্যা নাকি আত্মবিশ্বাসের অভাব—তা আগে নির্ধারণ করতে হবে। কারণ অনুযায়ী মেন্টরের পরামর্শ নিয়ে কাজ শুরু করো।",

      "তোমার প্রস্তুতি মাঝামাঝি পর্যায়ে রয়েছে। আরও ভালো করতে হলে অসম্পূর্ণ অধ্যায়গুলো দ্রুত শেষ করতে হবে এবং শেখা বিষয়গুলো প্রশ্ন অনুশীলনের মাধ্যমে যাচাই করতে হবে।",
    ],
  }),

  // ৩০%–৫০% — incorrect তুলনামূলক বেশি
  createCommentRule({
    id: 6,
    category:
      "মৌলিক ধারণা ও সঠিক উত্তর দেওয়ার দক্ষতা উন্নত করতে হবে",

    check: (p) =>
      p.totalPercentage >= 30 &&
      p.totalPercentage < 50 &&
      p.incorrectPercentage >= p.skippedPercentage + 5,

    comments: [
      "তুমি অনেক প্রশ্নের উত্তর দেওয়ার চেষ্টা করছো, কিন্তু ভুলের হার বেশি হওয়ায় ফলাফল কমে যাচ্ছে। আগে মৌলিক ধারণাগুলো পরিষ্কার করো এবং প্রতিটি প্রশ্ন বুঝে উত্তর দেওয়ার অভ্যাস তৈরি করো।",

      "বর্তমান প্রস্তুতিতে ধারণাগত দুর্বলতা দেখা যাচ্ছে। শুধু উত্তর মনে রাখার পরিবর্তে বিষয়গুলো বুঝে পড়ো এবং সহজ প্রশ্ন থেকে ধাপে ধাপে অনুশীলন শুরু করো।",

      "ভুল উত্তরের সংখ্যা কমানোর জন্য পড়া এবং অনুশীলনের পদ্ধতিতে পরিবর্তন আনতে হবে। প্রতিটি ভুল প্রশ্ন পুনরায় সমাধান করো এবং না বুঝলে দ্রুত শিক্ষক বা মেন্টরের সাহায্য নাও।",

      "এই পর্যায়ে বেশি প্রশ্ন করার চেয়ে সঠিকভাবে প্রশ্ন সমাধান শেখা বেশি গুরুত্বপূর্ণ। মৌলিক বিষয়গুলো পুনরায় পড়ো, উদাহরণ বুঝে নাও এবং অল্প অল্প করে নির্ভুলতা বাড়ানোর চেষ্টা করো।",
    ],
  }),

  // ৩০%–৫০% — skipped তুলনামূলক বেশি
  createCommentRule({
    id: 7,
    category:
      "প্রস্তুতি অসম্পূর্ণ, ভিত্তি শক্ত করে নিয়মিত এগোতে হবে",

    check: (p) =>
      p.totalPercentage >= 30 &&
      p.totalPercentage < 50 &&
      p.incorrectPercentage < p.skippedPercentage + 5,

    comments: [
      "পরীক্ষায় অনেক প্রশ্ন উত্তর না দিয়ে ছেড়ে দেওয়া হয়েছে, যা প্রস্তুতির অসম্পূর্ণতার ইঙ্গিত দেয়। প্রথমে প্রয়োজনীয় অধ্যায়গুলো শেষ করো এবং প্রতিদিন শেখা অংশ থেকে নিয়মিত প্রশ্ন অনুশীলন করো।",

      "তোমার প্রস্তুতিতে এখনো বেশ কিছু ঘাটতি রয়েছে। একসঙ্গে পুরো সিলেবাস শেষ করার চেষ্টা না করে অধ্যায়ভিত্তিক ছোট লক্ষ্য নির্ধারণ করো এবং প্রতিটি লক্ষ্য সম্পন্ন হওয়ার পর নিজেকে যাচাই করো।",

      "বর্তমান ফলাফল উন্নত করতে হলে নিয়মিত পড়াশোনার অভ্যাস এবং প্রশ্ন করার আত্মবিশ্বাস—দুটিই বাড়াতে হবে। যেসব প্রশ্ন বাদ গেছে, সেগুলোর অধ্যায় চিহ্নিত করে নতুনভাবে প্রস্তুতি নাও।",

      "এই বিষয়ে আরও সময় এবং পরিকল্পিত অনুশীলন প্রয়োজন। মৌলিক ধারণা পরিষ্কার করে সহজ প্রশ্ন থেকে শুরু করো এবং ধীরে ধীরে পরীক্ষার মানের প্রশ্ন সমাধানের দিকে এগিয়ে যাও।",
    ],
  }),
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
  const matchedRule = commentRules.find((rule) =>
    rule.check(percentageData)
  );

  return {
    ruleId: matchedRule?.id ?? null,

    category:
      matchedRule?.category ??
      "প্রস্তুতির অবস্থা বিস্তারিতভাবে পর্যালোচনা করা প্রয়োজন",

    comment:
      matchedRule?.comment ??
      "তোমার ফলাফলে একাধিক ধরনের প্রবণতা দেখা যাচ্ছে, তাই শুধু সামগ্রিক নম্বরের ভিত্তিতে নির্দিষ্ট সিদ্ধান্ত দেওয়া কঠিন। বিষয়ভিত্তিক পারফরম্যান্স, ভুল উত্তর এবং বাদ দেওয়া প্রশ্নগুলো মেন্টরের সঙ্গে পর্যালোচনা করে পরবর্তী প্রস্তুতির পরিকল্পনা ঠিক করো।",
  };
}


function generatePartitionAnalysis(title, subjects) {
  const percentageData = calculatePercentages(subjects);

  if (percentageData.totalMarks <= 0) {
    return {
      title,
      ...percentageData,
      ruleId: null,
      category: "পর্যাপ্ত তথ্য পাওয়া যায়নি",
      comment:
        "এই অংশের প্রস্তুতি মূল্যায়ন করার মতো কোনো ফলাফল পাওয়া যায়নি। প্রয়োজনীয় বিষয়গুলোর নম্বর যুক্ত হলে সঠিকভাবে বিশ্লেষণ করা যাবে।",
    };
  }

  const commentData = getInitialComment(percentageData);

  return {
    title,
    ...percentageData,
    ...commentData,
  };
}


function generateScienceComparisonComment(scienceData, generalData) {

  const scienceHasData = safeNumber(scienceData?.totalMarks) > 0;
  const generalHasData = safeNumber(generalData?.totalMarks) > 0;

  if (!scienceHasData || !generalHasData) {
    return {
      deviation: 0,
      weakerPart: "equal",
      category: "তুলনা করার মতো পর্যাপ্ত তথ্য পাওয়া যায়নি",
      comment:
        "Science ও General অংশের মধ্যে নির্ভরযোগ্য তুলনা করতে উভয় অংশের ফলাফল প্রয়োজন। প্রয়োজনীয় তথ্য যুক্ত হলে দুই অংশের প্রস্তুতির পার্থক্য সঠিকভাবে বিশ্লেষণ করা যাবে।",
    };
  }
  const sciencePercent = safeNumber(scienceData?.totalPercentage);
  const generalPercent = safeNumber(generalData?.totalPercentage);

  const deviation = Number(
    Math.abs(sciencePercent - generalPercent).toFixed(2)
  );

  const weakerPart =
    sciencePercent < generalPercent
      ? "science"
      : generalPercent < sciencePercent
      ? "general"
      : "equal";

  function getRandomComment(comments) {
    const randomIndex = Math.floor(Math.random() * comments.length);
    return comments[randomIndex];
  }

  // পার্থক্য ১৫%-এর কম
  if (deviation < 15) {
    const comments = [
      "Science ও General—দুই অংশেই তোমার প্রস্তুতি প্রায় সমান পর্যায়ে রয়েছে। যেদিকে নম্বর সামান্য কম, সেই অংশের ভুল ও বাদ দেওয়া প্রশ্নগুলো পর্যালোচনা করে নিয়মিত রিভিশন চালিয়ে যাও।",

      "দুই ধরনের বিষয়েই তোমার পারফরম্যান্সে ভালো ভারসাম্য রয়েছে। এই অবস্থান ধরে রাখতে Science-এর সমস্যা সমাধান এবং General বিষয়ের নিয়মিত রিভিশন—দুটিই সমানভাবে চালিয়ে যেতে হবে।",

      "Science ও General অংশের ফলাফলে বড় কোনো পার্থক্য নেই, যা ইতিবাচক। এখন যে অংশে সামান্য ঘাটতি রয়েছে, সেখানে একটু বাড়তি সময় দিলে সামগ্রিক ফলাফল আরও ভালো হবে।",

      "দুই অংশেই তোমার প্রস্তুতি কাছাকাছি পর্যায়ে রয়েছে। কোনো একটি অংশকে বেশি গুরুত্ব দিয়ে অন্যটি অবহেলা না করে বর্তমান পড়াশোনার ভারসাম্য বজায় রাখো।",
    ];

    return {
      deviation,
      weakerPart,
      category: "Science ও General—দুই অংশেই ভালো ভারসাম্য রয়েছে",
      comment: getRandomComment(comments),
    };
  }

  // পার্থক্য ১৫%–৩০%
  if (deviation <= 30) {
    if (weakerPart === "science") {
      const comments = [
        "General বিষয়ের তুলনায় Science অংশে তোমার প্রস্তুতি কিছুটা পিছিয়ে রয়েছে। Physics, Chemistry, Mathematics ও Biology-এর দুর্বল অধ্যায়গুলো চিহ্নিত করে ধারণা পরিষ্কার করা এবং নিয়মিত সমস্যা সমাধানের দিকে বেশি গুরুত্ব দাও।",

        "Science অংশে আরও পরিকল্পিতভাবে কাজ করা প্রয়োজন। শুধু সূত্র বা তথ্য মনে রাখার পরিবর্তে প্রতিটি ধারণা বুঝে পড়ো এবং শেখার পর পর্যাপ্ত প্রশ্ন সমাধান করো।",

        "তোমার General অংশের প্রস্তুতি ভালো হলেও Science বিষয়ে কিছু ঘাটতি রয়েছে। কোন বিষয়ে এবং কোন ধরনের প্রশ্নে বেশি সমস্যা হচ্ছে, তা নির্ধারণ করে প্রতিদিন নির্দিষ্ট সময় অনুশীলন করো।",

        "Science অংশে উন্নতির যথেষ্ট সুযোগ রয়েছে। মৌলিক ধারণা পরিষ্কার করে সহজ প্রশ্ন থেকে অনুশীলন শুরু করো এবং না বোঝা বিষয়গুলো মেন্টরের কাছ থেকে দ্রুত বুঝে নাও।",
      ];

      return {
        deviation,
        weakerPart,
        category: "Science অংশে আরও মনোযোগ ও অনুশীলন প্রয়োজন",
        comment: getRandomComment(comments),
      };
    }

    const comments = [
      "Science অংশের তুলনায় General বিষয়গুলোতে তোমার প্রস্তুতি কিছুটা পিছিয়ে রয়েছে। Bangla, English, Religion ও ICT-এর জন্য প্রতিদিন নির্দিষ্ট সময় রেখে নিয়মিত পড়া ও রিভিশন করতে হবে।",

      "General বিষয়গুলো সহজ মনে করে অনিয়মিত পড়ার কারণে নম্বর কমে যেতে পারে। প্রতিদিন অল্প সময় হলেও পড়া, লেখা এবং গুরুত্বপূর্ণ তথ্য পুনরাবৃত্তির অভ্যাস তৈরি করো।",

      "Science অংশে তোমার প্রস্তুতি ভালো, তবে General বিষয়ে আরও ধারাবাহিকতা প্রয়োজন। দুর্বল বিষয়গুলো চিহ্নিত করে অধ্যায়ভিত্তিক রিভিশন ও প্রশ্ন অনুশীলন বাড়াও।",

      "General অংশের ফলাফল উন্নত করতে নিয়মিত রিভিশনের বিকল্প নেই। যেসব বিষয়ে ভুল বা বাদ দেওয়া প্রশ্ন বেশি, সেগুলো আলাদা করে পরিকল্পনা অনুযায়ী পড়ো।",
    ];

    return {
      deviation,
      weakerPart,
      category: "General অংশে নিয়মিত রিভিশন আরও বাড়াতে হবে",
      comment: getRandomComment(comments),
    };
  }

  // পার্থক্য ৩০%-এর বেশি এবং Science দুর্বল
  if (weakerPart === "science") {
    const comments = [
      "General অংশের তুলনায় Science বিষয়ে তোমার পারফরম্যান্সে উল্লেখযোগ্য পার্থক্য রয়েছে। প্রথমে দুর্বল বিষয় ও অধ্যায়গুলো চিহ্নিত করে মৌলিক ধারণা পরিষ্কার করো, এরপর ধাপে ধাপে প্রশ্ন সমাধানের অনুশীলন বাড়াও।",

      "Science অংশের প্রস্তুতি নতুনভাবে গুছিয়ে নেওয়া প্রয়োজন। Physics, Chemistry, Mathematics ও Biology-এর ভিত্তি শক্ত না হলে পরবর্তী অংশগুলো কঠিন মনে হবে। তাই মেন্টরের নির্দেশনা অনুযায়ী পরিকল্পিতভাবে শুরু করো।",

      "Science বিষয়ে বর্তমান ঘাটতি কমাতে নিয়মিত ও বিষয়ভিত্তিক অনুশীলন প্রয়োজন। শুধু পড়া শেষ করার চেষ্টা না করে প্রতিটি ধারণা বুঝে উদাহরণ ও সমস্যা সমাধানের মাধ্যমে নিজেকে যাচাই করো।",

      "Science অংশে পিছিয়ে থাকলেও নিয়মিত কাজ করলে উন্নতি করা সম্ভব। প্রথমে সহজ ও মৌলিক অধ্যায়গুলো সম্পন্ন করো, ভুল প্রশ্নগুলো পুনরায় সমাধান করো এবং অগ্রগতি নিয়মিত যাচাই করো।",
    ];

    return {
      deviation,
      weakerPart,
      category: "Science অংশের ভিত্তি নতুনভাবে শক্ত করতে হবে",
      comment: getRandomComment(comments),
    };
  }

  // পার্থক্য ৩০%-এর বেশি এবং General দুর্বল
  const comments = [
    "Science অংশের তুলনায় General বিষয়ে তোমার পারফরম্যান্সে বড় পার্থক্য রয়েছে। General বিষয়গুলোকে কম গুরুত্বপূর্ণ মনে না করে প্রতিদিন নির্দিষ্ট সময় পড়া, লেখা ও রিভিশনের জন্য রাখতে হবে।",

    "General অংশে প্রস্তুতির ঘাটতি স্পষ্টভাবে দেখা যাচ্ছে। Bangla, English, Religion ও ICT-এর দুর্বল অধ্যায়গুলো চিহ্নিত করে নিয়মিত অধ্যায়ভিত্তিক রিভিশন শুরু করো।",

    "General বিষয়ের ফলাফল উন্নত করতে ধারাবাহিক পড়াশোনা প্রয়োজন। প্রতিদিন অল্প পরিমাণে হলেও পড়ো, গুরুত্বপূর্ণ তথ্য লিখে অনুশীলন করো এবং নিয়মিত নিজের প্রস্তুতি যাচাই করো।",

    "Science বিষয়ে ভালো করলেও General অংশের দুর্বলতা সামগ্রিক ফলাফলকে পিছিয়ে দিতে পারে। তাই বিষয়গুলো ভাগ করে একটি নিয়মিত রিভিশন পরিকল্পনা তৈরি করো এবং সেটি অনুসরণ করো।",
  ];

  return {
    deviation,
    weakerPart,
    category: "General অংশের প্রস্তুতি নতুনভাবে গুছিয়ে নিতে হবে",
    comment: getRandomComment(comments),
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

  const validSubjects = subjectBars.filter(
    (item) => safeNumber(item.totalMarks) > 0
  );

  function getRandomComment(comments) {
    const randomIndex = Math.floor(Math.random() * comments.length);
    return comments[randomIndex];
  }

  if (validSubjects.length === 0) {
    return {
      subjectBars,
      averagePercentage: 0,
      medianPercentage: 0,
      consistentPercentage: 0,
      lowSubjectCount: 0,
      lowSubjectRatio: 0,
      level: "পর্যাপ্ত তথ্য পাওয়া যায়নি",
      comment:
        "বিষয়ভিত্তিক প্রস্তুতি মূল্যায়ন করার মতো পর্যাপ্ত তথ্য পাওয়া যায়নি। সব বিষয়ের ফলাফল যুক্ত হওয়ার পর সামগ্রিক প্রস্তুতির অবস্থা আরও নির্ভুলভাবে বিশ্লেষণ করা যাবে।",
    };
  }

  const percentages = validSubjects.map((item) =>
    safeNumber(item.totalPercentage)
  );

  const sortedPercentages = [...percentages].sort((a, b) => a - b);
  const middleIndex = Math.floor(sortedPercentages.length / 2);

  const median =
    sortedPercentages.length % 2 === 0
      ? (sortedPercentages[middleIndex - 1] +
          sortedPercentages[middleIndex]) /
        2
      : sortedPercentages[middleIndex];

  // Median থেকে ২৫ শতাংশের মধ্যে থাকা বিষয়গুলোকে
  // স্বাভাবিক বা consistent performance হিসেবে ধরা হয়েছে
  const consistentSubjects = validSubjects.filter((item) => {
    const deviation = Math.abs(
      safeNumber(item.totalPercentage) - median
    );

    return deviation <= 25;
  });


  // সব বিষয় outlier হলে validSubjects ব্যবহার করা হবে
  const finalData =
    consistentSubjects.length > 0
      ? consistentSubjects
      : validSubjects;

  const averagePercentage = Number(
    (
      finalData.reduce(
        (sum, item) => sum + safeNumber(item.totalPercentage),
        0
      ) / finalData.length
    ).toFixed(2)
  );

  const totalSubjects = validSubjects.length;

  const consistentPercentage = Number(
    (
      (consistentSubjects.length / totalSubjects) *
      100
    ).toFixed(2)
  );

  const lowSubjectCount = validSubjects.filter(
    (item) => safeNumber(item.totalPercentage) < 55
  ).length;

  const lowSubjectRatio = Number(
    ((lowSubjectCount / totalSubjects) * 100).toFixed(2)
  );

  let level;
  let comments;

  /*
   * অধিকাংশ বিষয়ে ৫৫%-এর নিচে
   */
  if (averagePercentage < 55 && lowSubjectRatio >= 60) {
    level = "প্রস্তুতির ভিত্তি আরও শক্ত করতে হবে";

    comments = [
      "বেশিরভাগ বিষয়েই তোমার ফলাফল প্রত্যাশিত পর্যায়ে পৌঁছায়নি। এখন প্রথম কাজ হলো দুর্বল বিষয়গুলো চিহ্নিত করে মৌলিক ধারণা পরিষ্কার করা। প্রতিদিনের জন্য ছোট ও বাস্তবসম্মত লক্ষ্য নির্ধারণ করো এবং নিয়মিত মেন্টরের নির্দেশনা অনুযায়ী এগিয়ে যাও।",

      "সামগ্রিক ফলাফল থেকে বোঝা যাচ্ছে, পড়াশোনায় আরও নিয়মিত হওয়া প্রয়োজন। একসঙ্গে সবকিছু শেষ করার চেষ্টা না করে প্রতিদিন নির্দিষ্ট কয়েকটি বিষয় নিয়ে কাজ করো। শেখা অংশ নিয়মিত অনুশীলন ও পরীক্ষার মাধ্যমে যাচাই করতে হবে।",

      "একাধিক বিষয়ে প্রস্তুতির ঘাটতি দেখা যাচ্ছে। তবে পরিকল্পিতভাবে শুরু করলে উন্নতি করা সম্ভব। যেসব বিষয়ে নম্বর সবচেয়ে কম, সেগুলোর মৌলিক অধ্যায় আগে সম্পন্ন করো এবং না বোঝা বিষয়গুলো দ্রুত শিক্ষক বা মেন্টরের কাছ থেকে বুঝে নাও।",

      "বর্তমান অবস্থায় পড়ার সময়, পদ্ধতি এবং ধারাবাহিকতা—তিনটি দিকেই পরিবর্তন আনা প্রয়োজন। প্রতিদিনের পড়া প্রতিদিন শেষ করো, ভুল প্রশ্নগুলো পুনরায় সমাধান করো এবং অগ্রগতি নিয়মিত যাচাই করো।",
    ];
  }

  /*
   * গড় ফলাফল ৫৫%-এর নিচে,
   * কিন্তু অধিকাংশ বিষয় দুর্বল নয়
   */
  else if (averagePercentage < 55) {
    level = "কয়েকটি বিষয়ের ঘাটতি সামগ্রিক ফলাফলকে প্রভাবিত করছে";

    comments = [
      "তোমার কয়েকটি বিষয়ে ফলাফল তুলনামূলক ভালো হলেও দুর্বল বিষয়গুলোর কারণে সামগ্রিক ফলাফল কমে গেছে। কম নম্বর পাওয়া বিষয়গুলো আলাদাভাবে চিহ্নিত করে সেখানে বাড়তি সময় ও অনুশীলন দিতে হবে।",

      "সব বিষয়ে তোমার প্রস্তুতি একই পর্যায়ে নেই। কিছু বিষয়ে ভালো করলেও কয়েকটি বিষয়ের বড় ঘাটতি সামগ্রিক ফলাফলে প্রভাব ফেলছে। দুর্বল বিষয়গুলোর জন্য আলাদা পরিকল্পনা তৈরি করে নিয়মিত কাজ করো।",

      "তোমার প্রস্তুতিতে কিছু ইতিবাচক দিক রয়েছে, তবে কয়েকটি বিষয় এখনো যথেষ্ট পিছিয়ে আছে। ভালো বিষয়গুলোর ধারাবাহিকতা বজায় রেখে দুর্বল বিষয়গুলোর মৌলিক অংশ পুনরায় পড়া শুরু করো।",

      "সামগ্রিক উন্নতির জন্য এখন সব বিষয়ে সমান সময় দেওয়ার প্রয়োজন নেই। যেসব বিষয়ে নম্বর সবচেয়ে কম, সেগুলোকে অগ্রাধিকার দিয়ে পড়ো এবং প্রতিটি অধ্যায় শেষে প্রশ্ন সমাধানের মাধ্যমে নিজেকে যাচাই করো।",
    ];
  }

  /*
   * গড় ফলাফল ৫৫%–৭০%
   */
  else if (averagePercentage < 70) {
    level = "প্রস্তুতি মাঝারি পর্যায়ে রয়েছে";

    comments = [
      "তোমার সামগ্রিক প্রস্তুতি মাঝারি পর্যায়ে রয়েছে। কিছু বিষয়ে ভালো অগ্রগতি থাকলেও কয়েকটি বিষয়ে আরও কাজ করা প্রয়োজন। কম নম্বর পাওয়া বিষয়গুলো চিহ্নিত করে নিয়মিত রিভিশন ও প্রশ্ন অনুশীলন বাড়াও।",

      "তুমি প্রস্তুতির একটি গ্রহণযোগ্য পর্যায়ে আছো, তবে ভালো ফলাফলের জন্য আরও ধারাবাহিকতা প্রয়োজন। কোন বিষয়ে ধারণাগত সমস্যা এবং কোন বিষয়ে অনুশীলনের ঘাটতি রয়েছে, তা আলাদা করে নির্ধারণ করো।",

      "বর্তমান ফলাফল থেকে বোঝা যাচ্ছে, প্রস্তুতির ভিত্তি তৈরি হয়েছে। এখন দুর্বল বিষয়গুলোতে বাড়তি সময় দেওয়া এবং ভুল প্রশ্নগুলো নিয়মিত পর্যালোচনা করা প্রয়োজন। পরিকল্পনা অনুযায়ী এগোলে দ্রুত উন্নতি করা সম্ভব।",

      "তোমার প্রস্তুতিতে অগ্রগতি রয়েছে, তবে সব বিষয়ে পারফরম্যান্স সমান নয়। ভালো বিষয়গুলোর অবস্থান ধরে রেখে পিছিয়ে থাকা বিষয়গুলোতে অধ্যায়ভিত্তিক অনুশীলন ও নিয়মিত পরীক্ষা বাড়াও।",
    ];
  }

  /*
   * গড় ফলাফল ৭০% বা তার বেশি,
   * কিন্তু subject consistency তুলনামূলক কম
   */
  else if (consistentPercentage < 70) {
    level = "সামগ্রিক প্রস্তুতি ভালো, তবে বিষয়ভিত্তিক ভারসাম্য বাড়াতে হবে";

    comments = [
      "তোমার সামগ্রিক ফলাফল ভালো, তবে সব বিষয়ে প্রস্তুতির মান সমান নয়। কিছু বিষয়ে খুব ভালো করলেও কয়েকটি বিষয় তুলনামূলক পিছিয়ে রয়েছে। দুর্বল বিষয়গুলোর দিকে বাড়তি মনোযোগ দিলে ফলাফল আরও ভারসাম্যপূর্ণ হবে।",

      "তুমি ভালো প্রস্তুতি নিচ্ছো, কিন্তু বিষয়ভেদে ফলাফলে কিছুটা বেশি পার্থক্য দেখা যাচ্ছে। শক্তিশালী বিষয়গুলোর ধারাবাহিকতা বজায় রেখে কম নম্বর পাওয়া বিষয়গুলোতে নিয়মিত অনুশীলন বাড়াও।",

      "সামগ্রিক অবস্থান সন্তোষজনক হলেও কয়েকটি বিষয় তোমার গড় ফলাফলকে পিছিয়ে দিতে পারে। বিষয়ভিত্তিক ভুল ও বাদ দেওয়া প্রশ্নগুলো পর্যালোচনা করে দুর্বল জায়গাগুলোতে পরিকল্পিতভাবে কাজ করো।",

      "বেশিরভাগ বিষয়ে ভালো করলেও কিছু বিষয়ে প্রস্তুতির ঘাটতি রয়েছে। এখন নতুন বিষয় বেশি যোগ না করে দুর্বল অধ্যায়গুলো পরিষ্কার করা এবং নিয়মিত রিভিশন করার দিকে বেশি গুরুত্ব দাও।",
    ];
  }

  /*
   * ভালো গড় এবং ভালো consistency
   */
  else {
    level = "সামগ্রিক প্রস্তুতি ভালো ও ভারসাম্যপূর্ণ";

    comments = [
      "সব মিলিয়ে তোমার প্রস্তুতি ভালো এবং বিষয়গুলোর মধ্যে যথেষ্ট ভারসাম্য রয়েছে। এই অবস্থান ধরে রাখতে নিয়মিত রিভিশন, প্রশ্ন অনুশীলন এবং পরীক্ষার পর ভুল বিশ্লেষণ চালিয়ে যাও।",

      "তোমার অধিকাংশ বিষয়েই প্রস্তুতির মান সন্তোষজনক। এখন লক্ষ্য হওয়া উচিত ছোটখাটো ভুল কমানো এবং যে বিষয়গুলোতে তুলনামূলক কম নম্বর এসেছে, সেগুলো আরও শক্ত করা।",

      "সামগ্রিকভাবে তুমি সঠিক পথেই এগোচ্ছো। বিষয়ভিত্তিক ফলাফলেও ভালো ধারাবাহিকতা দেখা যাচ্ছে। আত্মতুষ্ট না হয়ে বর্তমান পড়াশোনার পদ্ধতি ও নিয়মিত অনুশীলন বজায় রাখো।",

      "তোমার প্রস্তুতিতে ভালো ভারসাম্য রয়েছে এবং অধিকাংশ বিষয়েই স্থিতিশীল ফলাফল দেখা যাচ্ছে। ভালো অবস্থান ধরে রাখার পাশাপাশি দুর্বল অধ্যায়গুলো নিয়মিত ঝালিয়ে নিলে ফলাফল আরও উন্নত হবে।",
    ];
  }

  return {
    subjectBars,
    averagePercentage,
    medianPercentage: Number(median.toFixed(2)),
    consistentPercentage,
    lowSubjectCount,
    lowSubjectRatio,
    level,
    comment: getRandomComment(comments),
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

