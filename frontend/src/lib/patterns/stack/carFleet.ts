// Car Fleet (NeetCode 150 · Stack).

import py from "../../guides/python/neetcode/car_fleet.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = { target: number; position: number[]; speed: number[] };
type Car = { p: number; s: number; d: number }; // d = distance left

const fmt = (d: number, s: number) => {
  const v = d / s;
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, "");
};
/** a arrives no later than b, compared exactly. */
const noLater = (a: Car, b: Car) => a.d * b.s <= b.d * a.s;

function run({ target, position, speed }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const cars: Car[] = position.map((p, i) => ({ p, s: speed[i], d: target - p })).sort((a, b) => b.p - a.p);
  const n = cars.length;
  let ops = n * Math.max(1, Math.ceil(Math.log2(Math.max(2, n))));
  const stack: Car[] = []; // fleet leaders
  const leader: number[] = cars.map(() => -1);
  const snap = (stage: string, k: number, explanation: string, extra: Partial<PatternStep> = {}) => {
    const tones: Record<number, "current" | "pointer" | "found" | "visited" | undefined> = {};
    cars.forEach((c, j) => {
      if (j < k) tones[j] = stack.includes(c) ? "pointer" : "visited";
    });
    if (k >= 0 && k < n) tones[k] = "current";
    steps.push({
      stage,
      explanation,
      rows: [
        row("position (closest to target first)", cars.map((c) => c.p), tones),
        row("speed", cars.map((c) => c.s), tones),
        row("time to reach the target alone", cars.map((c) => fmt(c.d, c.s)), tones, Object.fromEntries(cars.map((_, j) => [j, leader[j] >= 0 && leader[j] !== j ? `joins ${cars[leader[j]].p}` : leader[j] === j ? "leads" : undefined]))),
        row("stack: arrival time of each fleet", stack.map((c) => fmt(c.d, c.s)), stack.length ? { [stack.length - 1]: "pointer" } : {}, stack.length ? { [stack.length - 1]: "top" } : {}),
      ],
      vars: [
        { name: "target", value: String(target) },
        { name: "fleets", value: String(stack.length), tone: "found" },
      ],
      ops,
      ...extra,
    });
  };
  snap("start", -1, `Sort the cars by position, closest to the target (${target}) first, and work out how long each would take alone: (target − position) ÷ speed. A car can never pass the one ahead; if it would arrive sooner, it catches up and slows down to join that fleet.`);
  cars.forEach((c, k) => {
    ops++;
    const top = stack[stack.length - 1];
    if (top && noLater(c, top)) {
      leader[k] = cars.indexOf(top);
      snap("join", k, `The car at ${c.p} would arrive at ${fmt(c.d, c.s)}, no later than the fleet ahead (${fmt(top.d, top.s)}). It catches up before the target and joins that fleet, so no new fleet.`);
    } else {
      stack.push(c);
      leader[k] = k;
      snap("new", k, top ? `The car at ${c.p} needs ${fmt(c.d, c.s)}, longer than the fleet ahead (${fmt(top.d, top.s)}). It never catches up, so it leads a new fleet. Push its time.` : `The car at ${c.p} is closest to the target, so nothing is ahead of it. It leads the first fleet, arriving at ${fmt(c.d, c.s)}.`);
    }
  });
  snap("done", n, `Every car is placed. ${stack.length} fleet${stack.length === 1 ? "" : "s"} arrive${stack.length === 1 ? "s" : ""}, at times ${show(stack.map((c) => fmt(c.d, c.s)))}.`, { done: true, answer: String(stack.length) });
  return steps;
}

export const carFleet: PatternProblem<Input> = {
  id: "car-fleet",
  title: "Car Fleet",
  difficulty: "Medium",
  blind75: false,
  slug: "car-fleet",
  video: "Pr6T-3yB9RM",
  statement: "Cars drive along one lane towards a target, each at its own speed, and none can pass another. A faster car that catches a slower one slows down and they continue together as a fleet. How many fleets arrive at the target?",
  examples: [
    { label: "target 12, 5 cars", input: { target: 12, position: [10, 8, 0, 5, 3], speed: [2, 4, 1, 1, 3] } },
    { label: "target 100, 3 cars", input: { target: 100, position: [0, 2, 4], speed: [4, 2, 1] } },
    { label: "target 10, all separate", input: { target: 10, position: [8, 5, 1], speed: [1, 1, 1] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const target = g.int(12, 20);
    const position = g.shuffle(Array.from({ length: target }, (_, i) => i)).slice(0, g.int(3, 7));
    return { target, position, speed: position.map(() => g.int(1, 5)) };
  },
  big: {
    label: "200 cars",
    input: () => ({ target: 1000, position: Array.from({ length: 200 }, (_, i) => i * 4), speed: Array.from({ length: 200 }, (_, i) => ((i * 7) % 5) + 1) }),
  },
  describe: ({ target, position, speed }) => `target = ${target}, position = ${show(position)}, speed = ${show(speed)}`,
  run,
  solve: ({ target, position, speed }) => {
    // A car leads a fleet if it takes longer than every car ahead of it.
    const cars = position.map((p, i) => ({ p, s: speed[i], d: target - p }));
    return cars.filter((c) => cars.every((o) => o.p <= c.p || !noLater(c, o))).length;
  },
  brute: ({ target, position, speed }) => {
    let ops = 0;
    const cars = position.map((p, i) => ({ p, s: speed[i], d: target - p }));
    let fleets = 0;
    for (const c of cars) {
      let leads = true;
      for (const o of cars) {
        ops++;
        if (o.p > c.p && noLater(c, o)) leads = false;
      }
      if (leads) fleets++;
    }
    return { answer: fleets, ops };
  },
  bruteIdea: "For each car, check every car ahead of it to see whether it catches up with any of them: O(n²).",
  guide: {
    title: "Car Fleet",
    idea: [
      "Look at the cars from the one closest to the target backwards. Each car only cares about the fleet directly ahead: if it would arrive no later than that fleet on its own, it catches up and joins it.",
      "Keep the arrival time of each fleet on a stack. A car that would arrive later than the top starts a new fleet (push); one that would arrive sooner or at the same time merges (NeetCode pushes, then pops it). The answer is the stack's size.",
    ],
    whenToUse: ["Things that can't overtake and merge: process them in order from the front, keeping only the groups that are still separate.", "Sort first when the input order isn't the order that matters."],
    stages: [
      { id: "start", title: "Sort, closest to the target first", detail: "Time alone = (target − position) ÷ speed.", pseudo: "cars = sorted(zip(position, speed), reverse=True)" },
      { id: "new", title: "Slower than the fleet ahead → new fleet", detail: "It never catches up. Push its time.", pseudo: "stack.append(time)" },
      { id: "join", title: "Arrives no later → joins the fleet ahead", detail: "It's held back to that fleet's speed.", pseudo: "if stack[-1] <= stack[-2]: stack.pop()" },
      { id: "done", title: "Fleets = stack size", detail: "One time per fleet.", pseudo: "return len(stack)" },
    ],
    legend: [
      { tone: "current", label: "Current car" },
      { tone: "pointer", label: "Leads a fleet" },
      { tone: "visited", label: "Joined a fleet" },
    ],
    complexity: { time: "O(n log n)", space: "O(n)", why: "Sorting dominates; the pass after it is O(n)." },
    pitfalls: [
      "Compare times, not speeds: a fast car far behind may never catch a slow car near the target.",
      "Equal times count as catching up: they arrive together, as one fleet.",
    ],
    tryThis: ["Pick “target 12, 5 cars”: the car at 8 joins the car at 10 just as they reach the target.", "Pick “all separate”: same speed, so nobody ever catches anyone."],
    python: py,
  },
};
