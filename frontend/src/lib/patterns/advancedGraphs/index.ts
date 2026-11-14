// Advanced Graphs: the twelfth category of the NeetCode 150, in NeetCode's order.

import type { AnyProblem } from "../types";
import { alienDictionary } from "./alienDictionary";
import { cheapestFlights } from "./cheapestFlights";
import { minCostConnect } from "./minCostConnect";
import { networkDelay } from "./networkDelay";
import { reconstructItinerary } from "./reconstructItinerary";
import { swimRisingWater } from "./swimRisingWater";

export const ADVANCED_GRAPHS: AnyProblem[] = [reconstructItinerary, minCostConnect, networkDelay, swimRisingWater, alienDictionary, cheapestFlights];
