// Design Twitter (NeetCode 150 · Heap / Priority Queue).

import py from "../../guides/python/neetcode/design_twitter.py?raw";
import { row, rngFor } from "../helpers";
import type { PRow, PatternProblem, PatternStep } from "../types";
import { Heap, heapNodes, heapRow, pathEdge, pathTone } from "./heap";

/** Calls like "post 1 5" (user 1 posts tweet 5), "follow 1 2", "unfollow 1 2", "feed 1". */
type Input = { calls: string[] };

const LIMIT = 10;
const showFeeds = (fs: number[][]) => `[${fs.map((f) => `[${f.join(", ")}]`).join(", ")}]`;

type Tw = { id: number; time: number };

function run({ calls }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const tweets = new Map<number, Tw[]>(); // oldest first
  const follows = new Map<number, Set<number>>();
  const feeds: number[][] = [];
  let time = 0;
  let k = -1;
  let ops = 0;
  let h = new Heap("max");
  let feed: number[] = [];
  let lookAt: Set<number> | null = null;
  let taken = new Set<string>();
  const snap = (stage: string, explanation: string, tone: (i: number) => ReturnType<ReturnType<typeof pathTone>> = () => undefined, edge = tone, extra: Partial<PatternStep> = {}) => {
    const users = [...new Set([...tweets.keys(), ...follows.keys()])].sort((a, b) => a - b);
    const lists: PRow[] = users.map((u) =>
      row(
        `user ${u}'s tweets, oldest → newest${follows.get(u)?.size ? ` (follows ${[...follows.get(u)!].sort((a, b) => a - b).join(", ")})` : ""}`,
        (tweets.get(u) ?? []).map((t) => t.id),
        Object.fromEntries((tweets.get(u) ?? []).map((t, i) => [i, taken.has(`${u}:${t.time}`) ? "found" : lookAt && !lookAt.has(u) ? "idle" : undefined])),
        Object.fromEntries((tweets.get(u) ?? []).map((t, i) => [i, `t${t.time}`])),
      ),
    );
    steps.push({
      stage,
      explanation,
      rows: [row("calls", calls, Object.fromEntries(calls.map((_, j) => [j, j < k ? "idle" : j === k ? "current" : undefined]))), ...lists, ...(lookAt ? [heapRow("max-heap by time (tweet ids shown)", h, tone)] : [])],
      tree: lookAt ? { title: "max-heap: the newest unread tweet of each followed user", nodes: heapNodes(h, { tone, edge, note: (i) => `t${(h.a[i].data as { tw: Tw }).tw.time}` }) } : undefined,
      vars: [
        { name: "feed being built", value: lookAt ? `[${feed.join(", ")}]` : "–", tone: "found" },
        { name: "feeds returned", value: feeds.length ? showFeeds(feeds) : "–" },
      ],
      ops,
      ...extra,
    });
  };
  snap("start", `Each user keeps a list of their own tweets with a timestamp. A news feed is the ${LIMIT} newest tweets from the user and everyone they follow: merge those lists, newest first, with a max-heap, like merging k sorted lists.`);
  calls.forEach((call, j) => {
    k = j;
    const [op, a, b] = call.split(" ");
    const u = Number(a);
    const v = Number(b);
    ops++;
    lookAt = null;
    taken = new Set();
    if (op === "post") {
      time++;
      if (!tweets.has(u)) tweets.set(u, []);
      tweets.get(u)!.push({ id: v, time });
      snap("post", `User ${u} posts tweet ${v} at time ${time}. It goes on the end of their list, so each list stays sorted by time.`);
      return;
    }
    if (op === "follow" || op === "unfollow") {
      if (!follows.has(u)) follows.set(u, new Set());
      if (op === "follow") {
        if (u !== v) follows.get(u)!.add(v);
      } else follows.get(u)!.delete(v);
      snap("follow", `User ${u} ${op}s user ${v}: ${op === "follow" ? "add" : "remove"} ${v} ${op === "follow" ? "to" : "from"} ${u}'s set of followees.`);
      return;
    }
    // feed
    const who = new Set([u, ...(follows.get(u) ?? [])]);
    lookAt = who;
    h = new Heap("max");
    feed = [];
    for (const w of [...who].sort((x, y) => x - y)) {
      const list = tweets.get(w);
      if (list?.length) h.push({ key: list.at(-1)!.time, label: String(list.at(-1)!.id), data: { tw: list.at(-1)!, user: w, i: list.length - 1 } });
    }
    const others = [...who].filter((w) => w !== u).sort((x, y) => x - y);
    snap(
      "seed",
      `feed ${u}: ${others.length ? `look at user ${u} and the users they follow (${others.join(", ")})` : `user ${u} follows nobody, so only their own tweets count`}. Push each one's newest tweet into a max-heap ordered by time.`,
      (i) => (i === 0 ? "found" : undefined),
    );
    while (h.size && feed.length < LIMIT) {
      const { top, path } = h.pop();
      const d = top.data as { tw: Tw; user: number; i: number };
      feed.push(d.tw.id);
      taken.add(`${d.user}:${d.tw.time}`);
      let more = "";
      if (d.i > 0) {
        const prev = tweets.get(d.user)![d.i - 1];
        const up = h.push({ key: prev.time, label: String(prev.id), data: { tw: prev, user: d.user, i: d.i - 1 } });
        more = ` Then push user ${d.user}'s next older tweet, ${prev.id} (t${prev.time}).`;
        snap("pop", `Pop the newest: tweet ${d.tw.id} by user ${d.user} at t${d.tw.time}. Add it to the feed.${more}`, pathTone(up), pathEdge(up));
      } else snap("pop", `Pop the newest: tweet ${d.tw.id} by user ${d.user} at t${d.tw.time}. Add it to the feed. User ${d.user} has no older tweets.`, pathTone(path), pathEdge(path));
    }
    feeds.push(feed);
    snap("feed", feed.length === LIMIT ? `The feed has ${LIMIT} tweets, so stop: [${feed.join(", ")}].` : feed.length ? `The heap is empty: there ${feed.length === 1 ? "is only 1 tweet" : `are only ${feed.length} tweets`} to show. Feed: [${feed.join(", ")}].` : "Nobody in this feed has tweeted yet, so the feed is empty: [].");
  });
  k = calls.length;
  lookAt = null;
  taken = new Set();
  snap("done", `All calls done. The feeds were ${showFeeds(feeds)}.`, () => undefined, () => undefined, { done: true, answer: showFeeds(feeds) });
  return steps;
}

/** The slow way: for each feed, gather every followed tweet and sort them all by time. */
function slow({ calls }: Input) {
  const tweets: { u: number; id: number; time: number }[] = [];
  const follows = new Map<number, Set<number>>();
  const feeds: number[][] = [];
  let time = 0;
  let ops = 0;
  for (const call of calls) {
    const [op, a, b] = call.split(" ");
    const u = Number(a);
    const v = Number(b);
    ops++;
    if (op === "post") tweets.push({ u, id: v, time: ++time });
    else if (op === "follow") {
      if (!follows.has(u)) follows.set(u, new Set());
      if (u !== v) follows.get(u)!.add(v);
    } else if (op === "unfollow") follows.get(u)?.delete(v);
    else {
      const who = new Set([u, ...(follows.get(u) ?? [])]);
      const mine = tweets.filter((t) => who.has(t.u));
      const m = mine.length;
      ops += tweets.length + 2 * Math.ceil(m * Math.log2(Math.max(2, m))); // scan + sort estimate
      feeds.push(
        mine
          .sort((x, y) => y.time - x.time)
          .slice(0, LIMIT)
          .map((t) => t.id),
      );
    }
  }
  return { answer: showFeeds(feeds), ops };
}

export const designTwitter: PatternProblem<Input> = {
  id: "design-twitter",
  title: "Design Twitter",
  difficulty: "Medium",
  blind75: false,
  slug: "design-twitter",
  video: "pNichitDD2E",
  statement: "Design a tiny Twitter: postTweet(user, tweetId), follow(a, b), unfollow(a, b), and getNewsFeed(user), which returns the 10 most recent tweet ids from the user and the people they follow, newest first.",
  examples: [
    { label: "LeetCode's example", input: { calls: ["post 1 5", "feed 1", "follow 1 2", "post 2 6", "feed 1", "unfollow 1 2", "feed 1"] } },
    { label: "three users", input: { calls: ["post 1 11", "post 2 21", "post 3 31", "post 1 12", "post 2 22", "follow 1 2", "follow 1 3", "post 3 32", "feed 1", "feed 2"] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    let id = 1;
    const calls = Array.from({ length: g.int(5, 10) }, (_, i) => {
      const r = g.r();
      if (i < 2 || r < 0.45) return `post ${g.int(1, 3)} ${id++}`;
      if (r < 0.65) return `follow ${g.int(1, 3)} ${g.int(1, 3)}`;
      if (r < 0.75) return `unfollow ${g.int(1, 3)} ${g.int(1, 3)}`;
      return `feed ${g.int(1, 3)}`;
    });
    calls.push(`feed ${g.int(1, 3)}`);
    return { calls };
  },
  big: {
    label: "user 0 follows 20 users with 50 tweets each, 20 feeds",
    input: () => ({
      calls: [
        ...Array.from({ length: 20 }, (_, i) => `follow 0 ${i + 1}`),
        ...Array.from({ length: 1000 }, (_, i) => `post ${(i % 20) + 1} ${i + 1}`),
        ...Array.from({ length: 20 }, () => "feed 0"),
      ],
    }),
  },
  describe: ({ calls }) => calls.join(", "),
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "For each feed, collect every tweet from the user and their followees and sort them all by time, then keep 10. With many tweets, that sorts far more than the 10 you need. (The sort is estimated as m·log₂m comparisons plus as many moves.)",
  guide: {
    title: "Design Twitter",
    idea: [
      "Store each user's tweets in a list in posting order, with a global counter as the timestamp, and each user's followees in a set. post, follow and unfollow are then O(1).",
      "getNewsFeed is “merge k sorted lists, but stop after 10”: push the newest tweet of each followed user (and the user) into a max-heap by time. Pop the newest, add it to the feed, and push the next older tweet from the same user. Ten pops at most.",
    ],
    whenToUse: ["“The top few items across several sorted lists”: a heap seeded with each list's head.", "Design questions where one call needs a merge and the rest are simple bookkeeping."],
    stages: [
      { id: "start", title: "Tweet lists and follow sets", detail: "", pseudo: "self.tweets = defaultdict(list); self.follows = defaultdict(set)" },
      { id: "post", title: "post: append with a timestamp", detail: "", pseudo: "self.tweets[u].append([self.count, tweetId]); self.count -= 1" },
      { id: "follow", title: "follow / unfollow: update the set", detail: "", pseudo: "self.follows[a].add(b)  # or discard" },
      { id: "seed", title: "feed: push each followee's newest tweet", detail: "", pseudo: "heappush(heap, [count, tweetId, followee, index - 1])" },
      { id: "pop", title: "Pop the newest, push that user's next one", detail: "", pseudo: "res.append(tweetId); heappush(heap, [older count, older id, followee, index - 1])" },
      { id: "feed", title: "10 tweets, or the heap is empty", detail: "", pseudo: "return res" },
      { id: "done", title: "All calls answered", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "found", label: "Tweet in the feed / newest in the heap" },
      { tone: "current", label: "Where the pushed tweet settled" },
      { tone: "swap", label: "Heap path that changed" },
      { tone: "idle", label: "User not followed" },
    ],
    complexity: { time: "O(f + 10 log f) per feed", space: "O(tweets + follows)", why: "Seeding pushes one tweet per followee (f), then at most 10 pops and pushes on a heap of size f." },
    pitfalls: ["A user always sees their own tweets, even though they don't follow themselves.", "Unfollowing someone you don't follow must not crash: use a set's discard."],
    tryThis: ["In LeetCode's example, the third feed loses tweet 6 after the unfollow.", "In “three users”, feed 2 only shows user 2's tweets: following isn't mutual."],
    python: py,
  },
};
