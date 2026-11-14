// Graphs: the eleventh category of the NeetCode 150, in NeetCode's order.

import type { AnyProblem } from "../types";
import { cloneGraph } from "./cloneGraph";
import { connectedComponents } from "./connectedComponents";
import { courseSchedule } from "./courseSchedule";
import { courseSchedule2 } from "./courseSchedule2";
import { graphValidTree } from "./graphValidTree";
import { maxArea } from "./maxArea";
import { numIslands } from "./numIslands";
import { pacificAtlantic } from "./pacificAtlantic";
import { redundantConnection } from "./redundantConnection";
import { rottingOranges } from "./rottingOranges";
import { surroundedRegions } from "./surroundedRegions";
import { wallsAndGates } from "./wallsAndGates";
import { wordLadder } from "./wordLadder";

export const GRAPHS: AnyProblem[] = [
  numIslands,
  cloneGraph,
  maxArea,
  pacificAtlantic,
  surroundedRegions,
  rottingOranges,
  wallsAndGates,
  courseSchedule,
  courseSchedule2,
  redundantConnection,
  connectedComponents,
  graphValidTree,
  wordLadder,
];
