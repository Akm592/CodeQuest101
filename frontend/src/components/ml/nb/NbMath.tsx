// "The maths, step by step" for Naive Bayes: one email worked through by hand.
// Every number comes from lib/ml/naiveBayes (checked by naiveBayes.test.ts).

import * as React from "react";

import { classifyNb, prior, tokenize, trainNb, TRAINING_EMAILS, wordProb } from "../../../lib/ml/naiveBayes";
import { C } from "../colors";
import { Eq, SectionTitle, Step } from "../mathBlocks";

const EMAIL = "free cash today";
const r = (v: number, d = 4) => String(+v.toFixed(d));

const NbMath: React.FC = () => {
  const m = React.useMemo(() => trainNb(TRAINING_EMAILS, 1), []);
  const m0 = React.useMemo(() => trainNb(TRAINING_EMAILS, 0), []);
  const words = tokenize(EMAIL);
  const V = m.vocab.length;
  const ps = prior(m, "spam");
  const ph = prior(m, "ham");
  const spamScore = words.reduce((p, w) => p * wordProb(m, "spam", w), ps);
  const hamScore = words.reduce((p, w) => p * wordProb(m, "ham", w), ph);
  const post = classifyNb(m, EMAIL)!;
  const lnSpam = Math.log(ps) + words.reduce((s, w) => s + Math.log(wordProb(m, "spam", w)), 0);
  const lnHam = Math.log(ph) + words.reduce((s, w) => s + Math.log(wordProb(m, "ham", w)), 0);
  const c = (cls: "spam" | "ham", w: string) => m.counts[cls][w] ?? 0;

  return (
    <section aria-labelledby="nb-math-title" className="space-y-4">
      <SectionTitle id="nb-math-title" kicker="No magic, just counting" title="The maths, step by step">
        <p>
          We work through the email <span className="font-mono text-foreground">“{EMAIL}”</span> by hand, with smoothing on (α = 1). Every
          number is calculated by the same code as the filter above.
        </p>
      </SectionTitle>

      <ol className="space-y-3 p-0">
        <Step
          n={1}
          title="Bayes' rule in plain words"
          plain="The chance an email is spam, given its words, is: how common spam is, times how likely these words are in spam, divided by how likely these words are at all."
        >
          <p>P(spam | words) = P(spam) × P(words | spam) ÷ P(words)</p>
          <p className="text-muted-foreground">
            P(words) is the same for both classes, so to decide we can skip it and just compare P(class) × P(words | class). We divide at the end
            only to turn the scores into percentages.
          </p>
        </Step>

        <Step
          n={2}
          title="The naive step"
          plain="Working out P(words | spam) for the exact sentence would need every possible sentence. So we pretend each word is independent of the others, and multiply their chances."
        >
          <p>P(“{EMAIL}” | spam) ≈ P(free | spam) × P(cash | spam) × P(today | spam)</p>
          <p className="text-muted-foreground">That's the “naive” assumption. It's what makes the model so simple to train: just count words.</p>
        </Step>

        <Step
          n={3}
          title="Count the words, with smoothing"
          plain={`Each chance is (how often the word appears in that class + α) ÷ (all words in that class + α × the number of different words). Spam has ${m.totals.spam} words, normal email ${m.totals.ham}, and there are ${V} different words.`}
        >
          <p className="text-muted-foreground">P(word | class) = (count + 1) ÷ (class total + {V})</p>
          {words.map((w) => (
            <React.Fragment key={w}>
              <Eq lhs={`P(${w} | spam)`} rule={`(${c("spam", w)} + 1) ÷ (${m.totals.spam} + ${V})`} result={wordProb(m, "spam", w)} accent={C.redText} />
              <Eq lhs={`P(${w} | normal)`} rule={`(${c("ham", w)} + 1) ÷ (${m.totals.ham} + ${V})`} result={wordProb(m, "ham", w)} accent={C.teal} />
            </React.Fragment>
          ))}
        </Step>

        <Step n={4} tone="backward" title="Multiply it all together" plain={`Both classes had 6 of the 12 training emails, so each prior is ${ps}.`}>
          {/* Written in scientific notation: at 4 decimals both would round to almost nothing. */}
          <p className="whitespace-nowrap">
            spam score <span className="text-muted-foreground">= {ps} × {words.map((w) => r(wordProb(m, "spam", w))).join(" × ")} =</span>{" "}
            <span className="font-semibold text-destructive-bright">{spamScore.toExponential(3)}</span>
          </p>
          <p className="whitespace-nowrap">
            normal score <span className="text-muted-foreground">= {ph} × {words.map((w) => r(wordProb(m, "ham", w))).join(" × ")} =</span>{" "}
            <span className="font-semibold text-viz-current">{hamScore.toExponential(3)}</span>
          </p>
          <p className="pt-1 text-muted-foreground">
            {spamScore.toExponential(3)} means {spamScore.toFixed(8)}. Both are tiny, which is normal: what matters is that the spam score is about{" "}
            {(spamScore / hamScore).toFixed(1)} times bigger.
          </p>
        </Step>

        <Step n={5} tone="update" title="Turn the scores into percentages" plain="Divide each score by the two added together. That's the P(words) we skipped in step 1.">
          <Eq lhs="P(spam | email)" rule={`${spamScore.toExponential(3)} ÷ (${spamScore.toExponential(3)} + ${hamScore.toExponential(3)})`} result={post.spam} accent={C.redText} />
          <p className="pt-1">
            So the filter says <span className="font-semibold text-destructive-bright">{(post.spam * 100).toFixed(1)}% spam</span>.
          </p>
        </Step>

        <Step
          n={6}
          tone="backward"
          title="Why real code adds logs instead"
          plain="A long email multiplies hundreds of small numbers, and the result gets so tiny that a computer rounds it to 0. Taking logs turns multiplying into adding, which stays readable. The answer is exactly the same."
        >
          <Eq lhs="ln(spam score)" rule={`ln ${ps} + ${words.map((w) => `ln ${r(wordProb(m, "spam", w), 3)}`).join(" + ")}`} result={lnSpam} accent={C.redText} />
          <Eq lhs="ln(normal score)" rule={`ln ${ph} + ${words.map((w) => `ln ${r(wordProb(m, "ham", w), 3)}`).join(" + ")}`} result={lnHam} accent={C.teal} />
          <p className="pt-1 text-muted-foreground">
            The bigger (less negative) log wins, and e^(log) gives back the scores from step 4.
          </p>
        </Step>

        <Step
          n={7}
          tone="backward"
          title="Why smoothing matters"
          plain="Without smoothing (α = 0), a word that never appeared in spam gets a chance of exactly 0, and multiplying by 0 makes the whole spam score 0, however spammy the other words are."
        >
          <Eq lhs="P(meeting | spam), α = 0" rule={`${c("spam", "meeting")} ÷ ${m0.totals.spam}`} result={wordProb(m0, "spam", "meeting")} accent={C.redText} />
          <p className="pt-1 text-muted-foreground">
            So “free offer today meeting” comes out {(classifyNb(m0, "free offer today meeting")!.ham * 100).toFixed(0)}% normal with smoothing
            off, but {(classifyNb(m, "free offer today meeting")!.spam * 100).toFixed(0)}% spam with it on. Try it in the filter above.
          </p>
        </Step>
      </ol>
    </section>
  );
};

export default NbMath;
