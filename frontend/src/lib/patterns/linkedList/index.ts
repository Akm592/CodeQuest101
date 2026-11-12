// Linked List: the sixth category of the NeetCode 150, in NeetCode's order.

import type { AnyProblem } from "../types";
import { addTwoNumbers } from "./addTwoNumbers";
import { copyRandomList } from "./copyRandomList";
import { findDuplicate } from "./findDuplicate";
import { linkedListCycle } from "./linkedListCycle";
import { lruCache } from "./lruCache";
import { mergeKLists } from "./mergeKLists";
import { mergeTwoLists } from "./mergeTwoLists";
import { removeNth } from "./removeNth";
import { reorderList } from "./reorderList";
import { reverseKGroup } from "./reverseKGroup";
import { reverseList } from "./reverseList";

export const LINKED_LIST: AnyProblem[] = [reverseList, mergeTwoLists, reorderList, removeNth, copyRandomList, addTwoNumbers, linkedListCycle, findDuplicate, lruCache, mergeKLists, reverseKGroup];
