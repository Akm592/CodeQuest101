// Stack: the fourth category of the NeetCode 150, in NeetCode's order.

import type { AnyProblem } from "../types";
import { carFleet } from "./carFleet";
import { dailyTemperatures } from "./dailyTemperatures";
import { evalRpn } from "./evalRpn";
import { generateParentheses } from "./generateParentheses";
import { largestRectangle } from "./largestRectangle";
import { minStack } from "./minStack";
import { validParentheses } from "./validParentheses";

export const STACK: AnyProblem[] = [validParentheses, minStack, evalRpn, generateParentheses, dailyTemperatures, carFleet, largestRectangle];
