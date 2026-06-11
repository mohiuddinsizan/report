function PieBlock({ title, subtitle, data }) {
  const correct = data?.correctPercentage || 0;
  const incorrect = data?.incorrectPercentage || 0;
  const skipped = data?.skippedPercentage || 0;
  const total = data?.totalPercentage || correct || 0;
  const written = data?.writtenPercentage || 0;

  return (
    <div className="pieCard">
      <div className="pieCardHeader">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>

      <div
        className="pieChart"
        style={{
          background: `conic-gradient(
            #22c55e 0% ${correct}%,
            #ef4444 ${correct}% ${correct + incorrect}%,
            #f59e0b ${correct + incorrect}% 100%
          )`,
        }}
      >
        <div className="pieCenter">
          <strong>{correct}%</strong>
          <span>MCQ Correct</span>
        </div>
      </div>

      <div className="pieLegend">
        <div>
          <span className="dot correctDot"></span>
          MCQ Correct {correct}%
        </div>

        <div>
          <span className="dot incorrectDot"></span>
          MCQ Incorrect {incorrect}%
        </div>

        <div>
          <span className="dot skippedDot"></span>
          MCQ Skipped {skipped}%
        </div>

        <div>
          <span className="dot totalDot"></span>
          Total Result {total}%
        </div>

        <div>
          <span className="dot writtenDot"></span>
          Written {written}%
        </div>
      </div>
    </div>
  );
}

function CommentBlock({ label, title, comment, deviation }) {
  return (
    <div className="analysisComment">
      <div className="commentLabel">{label}</div>

      <div className="commentHeader">
        <h3>{title}</h3>

        {deviation !== undefined && (
          <span className="deviationBadge">Difference: {deviation}%</span>
        )}
      </div>

      <p>{comment}</p>
    </div>
  );
}

function getSubjectLevelClass(percentage) {
  const value = Number(percentage) || 0;

  if (value >= 90) return "subjectLevel excellent";
  if (value >= 80) return "subjectLevel good";
  if (value >= 65) return "subjectLevel average";
  if (value >= 50) return "subjectLevel warning";
  if (value >= 30) return "subjectLevel danger";

  return "subjectLevel critical";
}

function SubjectBarChart({ data }) {
  const bars = [...(data?.subjectBars || [])].sort(
    (a, b) => (b.totalPercentage || b.percentage || 0) - (a.totalPercentage || a.percentage || 0)
  );

  return (
    <div className="subjectBarCard">
      <div className="subjectBarHeader">
        <h3>Subject-wise Total Performance</h3>
        <p>
          Each bar shows the combined result of MCQ and written marks for that
          subject.
        </p>
      </div>

      <div className="realBarChart">
        {bars.map((item) => {
          const totalPercentage = item.totalPercentage || item.percentage || 0;

          return (
            <div className="chartColumn" key={item.subject}>
              <div className="chartValue">{totalPercentage}%</div>

              <div className="chartBarWrapper">
                <div
                  className="chartBar"
                  style={{
                    height: `${Math.max(totalPercentage, 4)}%`,
                  }}
                />
              </div>

              <div className="chartLabel">{item.subject}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubjectCommentList({ data }) {
  const subjects = [...(data?.subjectBars || [])].sort(
    (a, b) => (b.totalPercentage || b.percentage || 0) - (a.totalPercentage || a.percentage || 0)
  );

  if (subjects.length === 0) {
    return (
      <div className="subjectCommentList">
        <div className="subjectCommentItem">
          <h3>বিষয়ভিত্তিক মন্তব্য পাওয়া যায়নি</h3>
          <p>এই শিক্ষার্থীর জন্য বিষয়ভিত্তিক বিশ্লেষণের ডেটা পাওয়া যায়নি।</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subjectCommentList">
      <div className="subjectCommentListHeader">
        <h3>Subject-wise Bangla Comments</h3>
        <p>
          প্রতিটি বিষয়ের মোট শতাংশ অনুযায়ী সহজ ভাষায় অভিভাবক-বান্ধব মন্তব্য।
        </p>
      </div>

      {subjects.map((item) => {
        const totalPercentage = item.totalPercentage || item.percentage || 0;

        return (
          <div className="subjectCommentItem" key={item.subject}>
            <div className="subjectCommentTop">
              <div>
                <h3>{item.subject}</h3>
                <p>
                  MCQ: {item.mcqPercentage || 0}% | Written:{" "}
                  {item.writtenPercentage || 0}% | Total: {totalPercentage}%
                </p>
              </div>

              <span className={getSubjectLevelClass(totalPercentage)}>
                {totalPercentage}%
              </span>
            </div>

            <div className="subjectMarksMiniGrid">
              <div>
                <span>Correct</span>
                <b>{item.correct || 0}</b>
              </div>

              <div>
                <span>Incorrect</span>
                <b>{item.incorrect || 0}</b>
              </div>

              <div>
                <span>Skipped</span>
                <b>{item.skipped || 0}</b>
              </div>

              <div>
                <span>MCQ Total</span>
                <b>{item.mcqTotal || 0}</b>
              </div>

              <div>
                <span>Written</span>
                <b>{item.written || 0}</b>
              </div>

              <div>
                <span>Written Total</span>
                <b>{item.writtenTotal || 0}</b>
              </div>
            </div>

            <div className="subjectWiseComment">
              <h4>{item.subjectCommentCategory || "বিষয়ভিত্তিক মন্তব্য"}</h4>
              <p>{item.subjectComment || "মন্তব্য পাওয়া যায়নি।"}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AnalysisPair({
  title,
  description,
  leftTitle,
  leftSubtitle,
  leftData,
  rightTitle,
  rightSubtitle,
  rightData,
  comparison,
}) {
  return (
    <section className="analysisGroup">
      <div className="sectionHeading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="partitionAnalytics">
        <PieBlock title={leftTitle} subtitle={leftSubtitle} data={leftData} />

        <PieBlock title={rightTitle} subtitle={rightSubtitle} data={rightData} />
      </div>

      <div className="commentGrid">
        <CommentBlock
          label={`Comment for ${leftTitle} chart`}
          title={leftData?.category || `${leftTitle} বিশ্লেষণ`}
          comment={leftData?.comment || "মন্তব্য পাওয়া যায়নি।"}
        />

        <CommentBlock
          label={`Comment for ${rightTitle} chart`}
          title={rightData?.category || `${rightTitle} বিশ্লেষণ`}
          comment={rightData?.comment || "মন্তব্য পাওয়া যায়নি।"}
        />

        <CommentBlock
          label={`Comparison comment for ${leftTitle} and ${rightTitle}`}
          title={comparison?.category || "তুলনামূলক বিশ্লেষণ"}
          comment={comparison?.comment || "তুলনামূলক মন্তব্য পাওয়া যায়নি।"}
          deviation={comparison?.deviation || 0}
        />
      </div>
    </section>
  );
}

function StudentDetailsModal({ student, onClose }) {
  if (!student) return null;

  const analysis = student.analysis || {};
  const partitions = analysis.partitions || {};
  const mathPartitions = analysis.mathPartitions || {};
  const subjectConsistency = analysis.subjectConsistency || {};

  return (
    <div className="modalOverlay">
      <div className="modalContainer cleanModal">
        <button className="closeBtn" onClick={onClose}>
          ✕
        </button>

        <div className="detailsHero">
          <h1>Student Performance Analysis</h1>
          <h2>Roll: {student.roll}</h2>

          <div className="heroStats">
            <div>
              <span>Total Result</span>
              <b>{analysis.totalPercentage || 0}%</b>
            </div>

            <div>
              <span>MCQ Correct</span>
              <b>{analysis.correctPercentage || 0}%</b>
            </div>

            <div>
              <span>Written</span>
              <b>{analysis.writtenPercentage || 0}%</b>
            </div>
          </div>
        </div>

        <section className="analysisGroup">
          <div className="sectionHeading">
            <h2>Overall Analysis</h2>
            <p>
              Full exam summary including MCQ correct, incorrect, skipped and
              written performance.
            </p>
          </div>

          <div className="overallLayout">
            <PieBlock
              title="Overall MCQ Performance"
              subtitle="Correct, incorrect and skipped percentage from MCQ part"
              data={analysis}
            />

            <CommentBlock
              label="Comment for Overall Performance"
              title={analysis.category || "সামগ্রিক বিশ্লেষণ"}
              comment={analysis.comment || "মন্তব্য পাওয়া যায়নি।"}
            />
          </div>
        </section>

        <section className="analysisGroup">
          <div className="sectionHeading">
            <h2>Subject Consistency Analysis</h2>
            <p>
              This chart uses each subject’s total percentage from MCQ and
              written marks together.
            </p>
          </div>

          <div className="subjectChartLayout">
            <SubjectBarChart data={subjectConsistency} />

            <CommentBlock
              label="Comment for Subject-wise Bar Chart"
              title={
                subjectConsistency?.level ||
                "বিষয়ভিত্তিক ধারাবাহিকতা বিশ্লেষণ"
              }
              comment={
                subjectConsistency?.comment ||
                "বিষয়ভিত্তিক মন্তব্য পাওয়া যায়নি।"
              }
            />
          </div>

          <SubjectCommentList data={subjectConsistency} />
        </section>

        <AnalysisPair
          title="Science vs General Analysis"
          description="Comparison between Science subjects and General subjects using total result percentage."
          leftTitle="Science"
          leftSubtitle="Physics, Chemistry, Math, Biology, BGS"
          leftData={partitions.science}
          rightTitle="General"
          rightSubtitle="Bangla, English, Religion, ICT"
          rightData={partitions.nonScience}
          comparison={partitions.comparison}
        />

        <AnalysisPair
          title="Mathematical vs Non-Mathematical Analysis"
          description="Comparison between calculation-based and theory-based subjects using total result percentage."
          leftTitle="Mathematical"
          leftSubtitle="Math, Physics, Chemistry"
          leftData={mathPartitions.mathematical}
          rightTitle="Non-Mathematical"
          rightSubtitle="Bangla, English, Religion, ICT, Biology, BGS"
          rightData={mathPartitions.nonMathematical}
          comparison={mathPartitions.comparison}
        />
      </div>
    </div>
  );
}

export default StudentDetailsModal;