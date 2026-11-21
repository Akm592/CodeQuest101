// "The maths, step by step" for the Evaluation Metrics page, worked on the
// page's 20 emails at the default threshold. Every number comes from lib/ml/metrics.

import * as React from "react";

import { aucByPairs, confusion, DEFAULT_THRESHOLD, EMAILS, metricsOf, rocCurve, trapezoidArea } from "../../../lib/ml/metrics";
import { C } from "../colors";
import { Eq, SectionTitle, Step } from "../mathBlocks";

const MetricsMath: React.FC = () => {
  const c = confusion(EMAILS, DEFAULT_THRESHOLD);
  const m = metricsOf(c);
  const p = m.precision!;
  const r = m.recall!;
  // F1 against the plain average, on a lopsided filter.
  const lopP = 1;
  const lopR = 0.05;
  const lopF1 = (2 * lopP * lopR) / (lopP + lopR);
  const spam = EMAILS.filter((e) => e.spam);
  const normal = EMAILS.filter((e) => !e.spam);
  const wins = spam.reduce((n, s) => n + normal.filter((h) => s.score > h.score).length, 0);
  const pairs = spam.length * normal.length;
  const top = spam[0];

  return (
    <section aria-labelledby="em-math-title" className="space-y-4">
      <SectionTitle id="em-math-title" kicker="No magic, just counting" title="The maths, step by step">
        <p>
          The same 20 emails at threshold {DEFAULT_THRESHOLD}. Every metric is a fraction of the four counts, so once you have the table, the rest
          is division. Every number below comes from the same code as the plots above.
        </p>
      </SectionTitle>
      <ol className="space-y-3">
        <Step n={1} title="Count the four cells" plain="Sort every email by two questions: was it flagged, and is it really spam?">
          <p>
            <span style={{ color: C.green }}>TP = {c.tp}</span> (spam, flagged) · <span style={{ color: C.redText }}>FN = {c.fn}</span> (spam, missed)
          </p>
          <p>
            <span style={{ color: C.amber }}>FP = {c.fp}</span> (normal, flagged) · <span className="text-muted-foreground">TN = {c.tn}</span> (normal, left alone)
          </p>
          <p className="text-muted-foreground">
            {c.tp} + {c.fn} = {c.tp + c.fn} spam, {c.fp} + {c.tn} = {c.fp + c.tn} normal: all {EMAILS.length} emails, each counted once.
          </p>
        </Step>

        <Step n={2} title="Precision: trust in a flag" plain="Look only at the flagged column. What share of it is really spam?">
          <Eq lhs="precision" rule="TP ÷ (TP + FP)" nums={`${c.tp} ÷ (${c.tp} + ${c.fp})`} result={p} />
          <p className="text-muted-foreground">So when the filter flags an email, it's right about {Math.round(p * 100)}% of the time. False positives pull it down.</p>
        </Step>

        <Step n={3} title="Recall: how much spam is caught" plain="Look only at the spam row. What share of it was flagged?">
          <Eq lhs="recall" rule="TP ÷ (TP + FN)" nums={`${c.tp} ÷ (${c.tp} + ${c.fn})`} result={r} />
          <p className="text-muted-foreground">
            It catches {Math.round(r * 100)}% of the spam. False negatives pull it down. Recall is also called sensitivity, or the true positive rate.
          </p>
        </Step>

        <Step n={4} title="F1: why not just average them?" plain="F1 is the harmonic mean, which stays low unless both numbers are high." tone="backward">
          <Eq lhs="F1" rule="2 · P · R ÷ (P + R)" nums={`2 · ${p.toFixed(4)} · ${r.toFixed(4)} ÷ (${p.toFixed(4)} + ${r.toFixed(4)})`} result={m.f1!} accent={C.amber} />
          <p className="text-muted-foreground">
            Now a filter that flags just one email, correctly: precision {lopP}, recall {lopR}. The plain average is {((lopP + lopR) / 2).toFixed(3)}, which
            sounds fine. F1 is {lopF1.toFixed(3)}, which says what's really going on: it catches almost nothing.
          </p>
        </Step>

        <Step n={5} title="Accuracy and specificity" plain="Accuracy uses all four cells. Specificity is recall for the normal class.">
          <Eq lhs="accuracy" rule="(TP + TN) ÷ all" nums={`(${c.tp} + ${c.tn}) ÷ ${EMAILS.length}`} result={m.accuracy!} />
          <Eq lhs="specificity" rule="TN ÷ (TN + FP)" nums={`${c.tn} ÷ (${c.tn} + ${c.fp})`} result={m.specificity!} />
          <Eq lhs="false positive rate" rule="FP ÷ (FP + TN)" nums={`${c.fp} ÷ (${c.fp} + ${c.tn}) = 1 − specificity`} result={m.fpr!} />
        </Step>

        <Step n={6} title="AUC: one number for every threshold" plain="Pair every spam email with every normal email. How often does the spam score higher?" tone="update">
          <p>
            {spam.length} spam × {normal.length} normal = {pairs} pairs. For example, “{top.subject}” ({top.score}) outscores all {normal.length} normal emails.
          </p>
          <Eq lhs="AUC" rule="pairs the spam wins ÷ all pairs" nums={`${wins} ÷ ${pairs}`} result={aucByPairs(EMAILS)} accent={C.green} />
          <p className="text-muted-foreground">
            The area under the ROC curve, measured with trapezoids, gives the same {trapezoidArea(rocCurve(EMAILS)).toFixed(4)}. 1.0 means every spam email
            outscores every normal one; 0.5 is a coin flip. AUC never looks at a threshold, so it judges the ranking, not the cut.
          </p>
        </Step>
      </ol>
    </section>
  );
};

export default MetricsMath;
