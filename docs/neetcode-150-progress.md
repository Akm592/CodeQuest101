# NeetCode 150 on CodeQuest: progress and what's left

_Last updated: 12 November 2026._

CodeQuest's **Interview Patterns** section turns the [NeetCode 150](https://neetcode.io/roadmap) into animated, step-by-step pages, one page per NeetCode category, in NeetCode's order. Each problem is credited to NeetCode with a link to their video.

## Status at a glance

- **Done:** 45 of 150 problems, 6 of 18 categories.
- **Left:** 105 problems in 12 categories.
- **Next up:** Trees (15 problems). It needs a new tree view first.

| # | Category | Problems | Status | Page | Commit |
|---|---|---|---|---|---|
| 1 | Arrays & Hashing | 9 | ✅ Done | `/visualize/arraysHashing` | `0251748` |
| 2 | Two Pointers | 5 | ✅ Done | `/visualize/twoPointers` | `c0f36d6` |
| 3 | Sliding Window | 6 | ✅ Done | `/visualize/slidingWindow` | `01db307` |
| 4 | Stack | 7 | ✅ Done | `/visualize/stackPattern` | `ddd7c56` |
| 5 | Binary Search | 7 | ✅ Done | `/visualize/binarySearchPattern` | "Interview Patterns: Binary Search" |
| 6 | Linked List | 11 | ✅ Done | `/visualize/linkedListPattern` | "Interview Patterns: Linked List" |
| 7 | Trees | 15 | ⬜ To do | | |
| 8 | Tries | 3 | ⬜ To do | | |
| 9 | Heap / Priority Queue | 7 | ⬜ To do | | |
| 10 | Backtracking | 9 | ⬜ To do | | |
| 11 | Graphs | 13 | ⬜ To do | | |
| 12 | Advanced Graphs | 6 | ⬜ To do | | |
| 13 | 1-D Dynamic Programming | 12 | ⬜ To do | | |
| 14 | 2-D Dynamic Programming | 11 | ⬜ To do | | |
| 15 | Greedy | 8 | ⬜ To do | | |
| 16 | Intervals | 6 | ⬜ To do | | |
| 17 | Math & Geometry | 8 | ⬜ To do | | |
| 18 | Bit Manipulation | 7 | ⬜ To do | | |

## Done

### Arrays & Hashing (9) · `/visualize/arraysHashing`

Contains Duplicate, Valid Anagram, Two Sum, Group Anagrams, Top K Frequent Elements, Product of Array Except Self, Valid Sudoku, Encode and Decode Strings, Longest Consecutive Sequence.

### Two Pointers (5) · `/visualize/twoPointers`

Valid Palindrome, Two Sum II Input Array Is Sorted, 3Sum, Container With Most Water, Trapping Rain Water.

### Sliding Window (6) · `/visualize/slidingWindow`

Best Time to Buy And Sell Stock, Longest Substring Without Repeating Characters, Longest Repeating Character Replacement, Permutation In String, Minimum Window Substring, Sliding Window Maximum.

### Stack (7) · `/visualize/stackPattern`

Valid Parentheses, Min Stack, Evaluate Reverse Polish Notation, Generate Parentheses, Daily Temperatures, Car Fleet, Largest Rectangle In Histogram.

### Binary Search (7) · `/visualize/binarySearchPattern`

Binary Search, Search a 2D Matrix, Koko Eating Bananas, Find Minimum In Rotated Sorted Array, Search In Rotated Sorted Array, Time Based Key Value Store, Median of Two Sorted Arrays.

### Linked List (11) · `/visualize/linkedListPattern`

Reverse Linked List, Merge Two Sorted Lists, Reorder List, Remove Nth Node From End of List, Copy List With Random Pointer, Add Two Numbers, Linked List Cycle, Find The Duplicate Number, LRU Cache, Merge K Sorted Lists, Reverse Nodes In K Group.

## Left to build

Each table lists the problem, its difficulty, whether it's in the Blind 75, its LeetCode slug and NeetCode's YouTube video id, which is everything a problem file needs. **Visual idea** suggests how to show the category; **Link to** names existing CodeQuest pages to link from the intro.

### 7. Trees (15)

- **Visual idea:** Needs a tree view in StepView (nodes laid out by depth, tones for visited/current, values returned up the tree shown next to each node). Many answers are “what each node returns”, so show that.
- **Link to:** `binaryTree`, `tree`

| Problem | Difficulty | Blind 75 | LeetCode slug | NeetCode video |
|---|---|---|---|---|
| Invert Binary Tree | Easy | Yes | [`invert-binary-tree`](https://leetcode.com/problems/invert-binary-tree/) | [`OnSn2XEQ4MY`](https://www.youtube.com/watch?v=OnSn2XEQ4MY) |
| Maximum Depth of Binary Tree | Easy | Yes | [`maximum-depth-of-binary-tree`](https://leetcode.com/problems/maximum-depth-of-binary-tree/) | [`hTM3phVI6YQ`](https://www.youtube.com/watch?v=hTM3phVI6YQ) |
| Diameter of Binary Tree | Easy |  | [`diameter-of-binary-tree`](https://leetcode.com/problems/diameter-of-binary-tree/) | [`bkxqA8Rfv04`](https://www.youtube.com/watch?v=bkxqA8Rfv04) |
| Balanced Binary Tree | Easy |  | [`balanced-binary-tree`](https://leetcode.com/problems/balanced-binary-tree/) | [`QfJsau0ItOY`](https://www.youtube.com/watch?v=QfJsau0ItOY) |
| Same Tree | Easy | Yes | [`same-tree`](https://leetcode.com/problems/same-tree/) | [`vRbbcKXCxOw`](https://www.youtube.com/watch?v=vRbbcKXCxOw) |
| Subtree of Another Tree | Easy | Yes | [`subtree-of-another-tree`](https://leetcode.com/problems/subtree-of-another-tree/) | [`E36O5SWp-LE`](https://www.youtube.com/watch?v=E36O5SWp-LE) |
| Lowest Common Ancestor of a Binary Search Tree | Medium | Yes | [`lowest-common-ancestor-of-a-binary-search-tree`](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/) | [`gs2LMfuOR9k`](https://www.youtube.com/watch?v=gs2LMfuOR9k) |
| Binary Tree Level Order Traversal | Medium | Yes | [`binary-tree-level-order-traversal`](https://leetcode.com/problems/binary-tree-level-order-traversal/) | [`6ZnyEApgFYg`](https://www.youtube.com/watch?v=6ZnyEApgFYg) |
| Binary Tree Right Side View | Medium |  | [`binary-tree-right-side-view`](https://leetcode.com/problems/binary-tree-right-side-view/) | [`d4zLyf32e3I`](https://www.youtube.com/watch?v=d4zLyf32e3I) |
| Count Good Nodes In Binary Tree | Medium |  | [`count-good-nodes-in-binary-tree`](https://leetcode.com/problems/count-good-nodes-in-binary-tree/) | [`7cp5imvDzl4`](https://www.youtube.com/watch?v=7cp5imvDzl4) |
| Validate Binary Search Tree | Medium | Yes | [`validate-binary-search-tree`](https://leetcode.com/problems/validate-binary-search-tree/) | [`s6ATEkipzow`](https://www.youtube.com/watch?v=s6ATEkipzow) |
| Kth Smallest Element In a Bst | Medium | Yes | [`kth-smallest-element-in-a-bst`](https://leetcode.com/problems/kth-smallest-element-in-a-bst/) | [`5LUXSvjmGCw`](https://www.youtube.com/watch?v=5LUXSvjmGCw) |
| Construct Binary Tree From Preorder And Inorder Traversal | Medium | Yes | [`construct-binary-tree-from-preorder-and-inorder-traversal`](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/) | [`ihj4IQGZ2zc`](https://www.youtube.com/watch?v=ihj4IQGZ2zc) |
| Binary Tree Maximum Path Sum | Hard | Yes | [`binary-tree-maximum-path-sum`](https://leetcode.com/problems/binary-tree-maximum-path-sum/) | [`Hr5cWUld4vU`](https://www.youtube.com/watch?v=Hr5cWUld4vU) |
| Serialize And Deserialize Binary Tree | Hard | Yes | [`serialize-and-deserialize-binary-tree`](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/) | [`u4JAi2JJhI8`](https://www.youtube.com/watch?v=u4JAi2JJhI8) |

### 8. Tries (3)

- **Visual idea:** A trie view (nodes = letters, end-of-word marks). Word Search II also needs the grid view (already exists for Sudoku).
- **Link to:** `trie`

| Problem | Difficulty | Blind 75 | LeetCode slug | NeetCode video |
|---|---|---|---|---|
| Implement Trie Prefix Tree | Medium | Yes | [`implement-trie-prefix-tree`](https://leetcode.com/problems/implement-trie-prefix-tree/) | [`oobqoCJlHA0`](https://www.youtube.com/watch?v=oobqoCJlHA0) |
| Design Add And Search Words Data Structure | Medium | Yes | [`design-add-and-search-words-data-structure`](https://leetcode.com/problems/design-add-and-search-words-data-structure/) | [`BTf05gs_8iU`](https://www.youtube.com/watch?v=BTf05gs_8iU) |
| Word Search II | Hard | Yes | [`word-search-ii`](https://leetcode.com/problems/word-search-ii/) | [`asbcE9mZz_U`](https://www.youtube.com/watch?v=asbcE9mZz_U) |

### 9. Heap / Priority Queue (7)

- **Visual idea:** Show the heap both as a tree and as the array behind it; highlight sift-up / sift-down swaps. Find Median: two heaps side by side.
- **Link to:** `heap`

| Problem | Difficulty | Blind 75 | LeetCode slug | NeetCode video |
|---|---|---|---|---|
| Kth Largest Element In a Stream | Easy |  | [`kth-largest-element-in-a-stream`](https://leetcode.com/problems/kth-largest-element-in-a-stream/) | [`hOjcdrqMoQ8`](https://www.youtube.com/watch?v=hOjcdrqMoQ8) |
| Last Stone Weight | Easy |  | [`last-stone-weight`](https://leetcode.com/problems/last-stone-weight/) | [`B-QCq79-Vfw`](https://www.youtube.com/watch?v=B-QCq79-Vfw) |
| K Closest Points to Origin | Medium |  | [`k-closest-points-to-origin`](https://leetcode.com/problems/k-closest-points-to-origin/) | [`rI2EBUEMfTk`](https://www.youtube.com/watch?v=rI2EBUEMfTk) |
| Kth Largest Element In An Array | Medium |  | [`kth-largest-element-in-an-array`](https://leetcode.com/problems/kth-largest-element-in-an-array/) | [`XEmy13g1Qxc`](https://www.youtube.com/watch?v=XEmy13g1Qxc) |
| Task Scheduler | Medium |  | [`task-scheduler`](https://leetcode.com/problems/task-scheduler/) | [`s8p8ukTyA2I`](https://www.youtube.com/watch?v=s8p8ukTyA2I) |
| Design Twitter | Medium |  | [`design-twitter`](https://leetcode.com/problems/design-twitter/) | [`pNichitDD2E`](https://www.youtube.com/watch?v=pNichitDD2E) |
| Find Median From Data Stream | Hard | Yes | [`find-median-from-data-stream`](https://leetcode.com/problems/find-median-from-data-stream/) | [`itmhHWaHupI`](https://www.youtube.com/watch?v=itmhHWaHupI) |

### 10. Backtracking (9)

- **Visual idea:** A recursion tree (choices as branches, dead ends crossed out) plus the current path as a stack row, like Generate Parentheses. Word Search and N-Queens use the grid view.
- **Link to:** `nQueens`

| Problem | Difficulty | Blind 75 | LeetCode slug | NeetCode video |
|---|---|---|---|---|
| Subsets | Medium |  | [`subsets`](https://leetcode.com/problems/subsets/) | [`REOH22Xwdkk`](https://www.youtube.com/watch?v=REOH22Xwdkk) |
| Combination Sum | Medium | Yes | [`combination-sum`](https://leetcode.com/problems/combination-sum/) | [`GBKI9VSKdGg`](https://www.youtube.com/watch?v=GBKI9VSKdGg) |
| Permutations | Medium |  | [`permutations`](https://leetcode.com/problems/permutations/) | [`s7AvT7cGdSo`](https://www.youtube.com/watch?v=s7AvT7cGdSo) |
| Subsets II | Medium |  | [`subsets-ii`](https://leetcode.com/problems/subsets-ii/) | [`Vn2v6ajA7U0`](https://www.youtube.com/watch?v=Vn2v6ajA7U0) |
| Combination Sum II | Medium |  | [`combination-sum-ii`](https://leetcode.com/problems/combination-sum-ii/) | [`rSA3t6BDDwg`](https://www.youtube.com/watch?v=rSA3t6BDDwg) |
| Word Search | Medium | Yes | [`word-search`](https://leetcode.com/problems/word-search/) | [`pfiQ_PS1g8E`](https://www.youtube.com/watch?v=pfiQ_PS1g8E) |
| Palindrome Partitioning | Medium |  | [`palindrome-partitioning`](https://leetcode.com/problems/palindrome-partitioning/) | [`3jvWodd7ht0`](https://www.youtube.com/watch?v=3jvWodd7ht0) |
| Letter Combinations of a Phone Number | Medium |  | [`letter-combinations-of-a-phone-number`](https://leetcode.com/problems/letter-combinations-of-a-phone-number/) | [`0snEunUacZY`](https://www.youtube.com/watch?v=0snEunUacZY) |
| N Queens | Hard |  | [`n-queens`](https://leetcode.com/problems/n-queens/) | [`Ph95IHmRp5M`](https://www.youtube.com/watch?v=Ph95IHmRp5M) |

### 11. Graphs (13)

- **Visual idea:** Grid problems (islands, oranges, walls and gates) use the 9×9 grid view, generalised to any size. Node-and-edge problems need a small graph view. BFS queue / DFS stack shown as rows. Union-find: a parent array plus a forest.
- **Link to:** `graph`, `topologicalSort` (Course Schedule)

| Problem | Difficulty | Blind 75 | LeetCode slug | NeetCode video |
|---|---|---|---|---|
| Number of Islands | Medium | Yes | [`number-of-islands`](https://leetcode.com/problems/number-of-islands/) | [`pV2kpPD66nE`](https://www.youtube.com/watch?v=pV2kpPD66nE) |
| Clone Graph | Medium | Yes | [`clone-graph`](https://leetcode.com/problems/clone-graph/) | [`mQeF6bN8hMk`](https://www.youtube.com/watch?v=mQeF6bN8hMk) |
| Max Area of Island | Medium |  | [`max-area-of-island`](https://leetcode.com/problems/max-area-of-island/) | [`iJGr1OtmH0c`](https://www.youtube.com/watch?v=iJGr1OtmH0c) |
| Pacific Atlantic Water Flow | Medium | Yes | [`pacific-atlantic-water-flow`](https://leetcode.com/problems/pacific-atlantic-water-flow/) | [`s-VkcjHqkGI`](https://www.youtube.com/watch?v=s-VkcjHqkGI) |
| Surrounded Regions | Medium |  | [`surrounded-regions`](https://leetcode.com/problems/surrounded-regions/) | [`9z2BunfoZ5Y`](https://www.youtube.com/watch?v=9z2BunfoZ5Y) |
| Rotting Oranges | Medium |  | [`rotting-oranges`](https://leetcode.com/problems/rotting-oranges/) | [`y704fEOx0s0`](https://www.youtube.com/watch?v=y704fEOx0s0) |
| Walls And Gates | Medium |  | [`walls-and-gates`](https://leetcode.com/problems/walls-and-gates/) | [`e69C6xhiSQE`](https://www.youtube.com/watch?v=e69C6xhiSQE) |
| Course Schedule | Medium | Yes | [`course-schedule`](https://leetcode.com/problems/course-schedule/) | [`EgI5nU9etnU`](https://www.youtube.com/watch?v=EgI5nU9etnU) |
| Course Schedule II | Medium |  | [`course-schedule-ii`](https://leetcode.com/problems/course-schedule-ii/) | [`Akt3glAwyfY`](https://www.youtube.com/watch?v=Akt3glAwyfY) |
| Redundant Connection | Medium |  | [`redundant-connection`](https://leetcode.com/problems/redundant-connection/) | [`FXWRE67PLL0`](https://www.youtube.com/watch?v=FXWRE67PLL0) |
| Number of Connected Components In An Undirected Graph | Medium | Yes | [`number-of-connected-components-in-an-undirected-graph`](https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/) | [`8f1XPm4WOUc`](https://www.youtube.com/watch?v=8f1XPm4WOUc) |
| Graph Valid Tree | Medium | Yes | [`graph-valid-tree`](https://leetcode.com/problems/graph-valid-tree/) | [`bXsUuownnoQ`](https://www.youtube.com/watch?v=bXsUuownnoQ) |
| Word Ladder | Hard |  | [`word-ladder`](https://leetcode.com/problems/word-ladder/) | [`h9iTnkgv05E`](https://www.youtube.com/watch?v=h9iTnkgv05E) |

### 12. Advanced Graphs (6)

- **Visual idea:** Weighted graph view with distances on nodes; the priority queue as a row (Dijkstra, Prim). Alien Dictionary reuses topological sort.
- **Link to:** `graph`, `topologicalSort`

| Problem | Difficulty | Blind 75 | LeetCode slug | NeetCode video |
|---|---|---|---|---|
| Reconstruct Itinerary | Hard |  | [`reconstruct-itinerary`](https://leetcode.com/problems/reconstruct-itinerary/) | [`ZyB_gQ8vqGA`](https://www.youtube.com/watch?v=ZyB_gQ8vqGA) |
| Min Cost to Connect All Points | Medium |  | [`min-cost-to-connect-all-points`](https://leetcode.com/problems/min-cost-to-connect-all-points/) | [`f7JOBJIC-NA`](https://www.youtube.com/watch?v=f7JOBJIC-NA) |
| Network Delay Time | Medium |  | [`network-delay-time`](https://leetcode.com/problems/network-delay-time/) | [`EaphyqKU4PQ`](https://www.youtube.com/watch?v=EaphyqKU4PQ) |
| Swim In Rising Water | Hard |  | [`swim-in-rising-water`](https://leetcode.com/problems/swim-in-rising-water/) | [`amvrKlMLuGY`](https://www.youtube.com/watch?v=amvrKlMLuGY) |
| Alien Dictionary | Hard | Yes | [`alien-dictionary`](https://leetcode.com/problems/alien-dictionary/) | [`6kTZYvNNyps`](https://www.youtube.com/watch?v=6kTZYvNNyps) |
| Cheapest Flights Within K Stops | Medium |  | [`cheapest-flights-within-k-stops`](https://leetcode.com/problems/cheapest-flights-within-k-stops/) | [`5eIK3zUdYmE`](https://www.youtube.com/watch?v=5eIK3zUdYmE) |

### 13. 1-D Dynamic Programming (12)

- **Visual idea:** The dp array filling left to right, with arrows from the cells each entry is built from. Show the recurrence with the actual numbers.
- **Link to:** `dynamicProgramming`

| Problem | Difficulty | Blind 75 | LeetCode slug | NeetCode video |
|---|---|---|---|---|
| Climbing Stairs | Easy | Yes | [`climbing-stairs`](https://leetcode.com/problems/climbing-stairs/) | [`Y0lT9Fck7qI`](https://www.youtube.com/watch?v=Y0lT9Fck7qI) |
| Min Cost Climbing Stairs | Easy |  | [`min-cost-climbing-stairs`](https://leetcode.com/problems/min-cost-climbing-stairs/) | [`ktmzAZWkEZ0`](https://www.youtube.com/watch?v=ktmzAZWkEZ0) |
| House Robber | Medium | Yes | [`house-robber`](https://leetcode.com/problems/house-robber/) | [`73r3KWiEvyk`](https://www.youtube.com/watch?v=73r3KWiEvyk) |
| House Robber II | Medium | Yes | [`house-robber-ii`](https://leetcode.com/problems/house-robber-ii/) | [`rWAJCfYYOvM`](https://www.youtube.com/watch?v=rWAJCfYYOvM) |
| Longest Palindromic Substring | Medium | Yes | [`longest-palindromic-substring`](https://leetcode.com/problems/longest-palindromic-substring/) | [`XYQecbcd6_c`](https://www.youtube.com/watch?v=XYQecbcd6_c) |
| Palindromic Substrings | Medium | Yes | [`palindromic-substrings`](https://leetcode.com/problems/palindromic-substrings/) | [`4RACzI5-du8`](https://www.youtube.com/watch?v=4RACzI5-du8) |
| Decode Ways | Medium | Yes | [`decode-ways`](https://leetcode.com/problems/decode-ways/) | [`6aEyTjOwlJU`](https://www.youtube.com/watch?v=6aEyTjOwlJU) |
| Coin Change | Medium | Yes | [`coin-change`](https://leetcode.com/problems/coin-change/) | [`H9bfqozjoqs`](https://www.youtube.com/watch?v=H9bfqozjoqs) |
| Maximum Product Subarray | Medium | Yes | [`maximum-product-subarray`](https://leetcode.com/problems/maximum-product-subarray/) | [`lXVy6YWFcRM`](https://www.youtube.com/watch?v=lXVy6YWFcRM) |
| Word Break | Medium | Yes | [`word-break`](https://leetcode.com/problems/word-break/) | [`Sx9NNgInc3A`](https://www.youtube.com/watch?v=Sx9NNgInc3A) |
| Longest Increasing Subsequence | Medium | Yes | [`longest-increasing-subsequence`](https://leetcode.com/problems/longest-increasing-subsequence/) | [`cjWnW0hdF1Y`](https://www.youtube.com/watch?v=cjWnW0hdF1Y) |
| Partition Equal Subset Sum | Medium |  | [`partition-equal-subset-sum`](https://leetcode.com/problems/partition-equal-subset-sum/) | [`IsvocB5BJhw`](https://www.youtube.com/watch?v=IsvocB5BJhw) |

### 14. 2-D Dynamic Programming (11)

- **Visual idea:** The dp table filling cell by cell (the grid view, with row/column headers), arrows from the cells each entry uses.
- **Link to:** `dynamicProgramming`

| Problem | Difficulty | Blind 75 | LeetCode slug | NeetCode video |
|---|---|---|---|---|
| Unique Paths | Medium | Yes | [`unique-paths`](https://leetcode.com/problems/unique-paths/) | [`IlEsdxuD4lY`](https://www.youtube.com/watch?v=IlEsdxuD4lY) |
| Longest Common Subsequence | Medium | Yes | [`longest-common-subsequence`](https://leetcode.com/problems/longest-common-subsequence/) | [`Ua0GhsJSlWM`](https://www.youtube.com/watch?v=Ua0GhsJSlWM) |
| Best Time to Buy And Sell Stock With Cooldown | Medium |  | [`best-time-to-buy-and-sell-stock-with-cooldown`](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/) | [`I7j0F7AHpb8`](https://www.youtube.com/watch?v=I7j0F7AHpb8) |
| Coin Change II | Medium |  | [`coin-change-ii`](https://leetcode.com/problems/coin-change-ii/) | [`Mjy4hd2xgrs`](https://www.youtube.com/watch?v=Mjy4hd2xgrs) |
| Target Sum | Medium |  | [`target-sum`](https://leetcode.com/problems/target-sum/) | [`g0npyaQtAQM`](https://www.youtube.com/watch?v=g0npyaQtAQM) |
| Interleaving String | Medium |  | [`interleaving-string`](https://leetcode.com/problems/interleaving-string/) | [`3Rw3p9LrgvE`](https://www.youtube.com/watch?v=3Rw3p9LrgvE) |
| Longest Increasing Path In a Matrix | Hard |  | [`longest-increasing-path-in-a-matrix`](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/) | [`wCc_nd-GiEc`](https://www.youtube.com/watch?v=wCc_nd-GiEc) |
| Distinct Subsequences | Hard |  | [`distinct-subsequences`](https://leetcode.com/problems/distinct-subsequences/) | [`-RDzMJ33nx8`](https://www.youtube.com/watch?v=-RDzMJ33nx8) |
| Edit Distance | Medium |  | [`edit-distance`](https://leetcode.com/problems/edit-distance/) | [`XYi2-LPrwm4`](https://www.youtube.com/watch?v=XYi2-LPrwm4) |
| Burst Balloons | Hard |  | [`burst-balloons`](https://leetcode.com/problems/burst-balloons/) | [`VFskby7lUbw`](https://www.youtube.com/watch?v=VFskby7lUbw) |
| Regular Expression Matching | Hard |  | [`regular-expression-matching`](https://leetcode.com/problems/regular-expression-matching/) | [`HAA8mgxlov8`](https://www.youtube.com/watch?v=HAA8mgxlov8) |

### 15. Greedy (8)

- **Visual idea:** Mostly array rows with a running value (Kadane's sum, the farthest reach in Jump Game) and a short “why greedy is safe” proof per problem.
- **Link to:** none

| Problem | Difficulty | Blind 75 | LeetCode slug | NeetCode video |
|---|---|---|---|---|
| Maximum Subarray | Medium | Yes | [`maximum-subarray`](https://leetcode.com/problems/maximum-subarray/) | [`5WZl3MMT0Eg`](https://www.youtube.com/watch?v=5WZl3MMT0Eg) |
| Jump Game | Medium | Yes | [`jump-game`](https://leetcode.com/problems/jump-game/) | [`Yan0cv2cLy8`](https://www.youtube.com/watch?v=Yan0cv2cLy8) |
| Jump Game II | Medium |  | [`jump-game-ii`](https://leetcode.com/problems/jump-game-ii/) | [`dJ7sWiOoK7g`](https://www.youtube.com/watch?v=dJ7sWiOoK7g) |
| Gas Station | Medium |  | [`gas-station`](https://leetcode.com/problems/gas-station/) | [`lJwbPZGo05A`](https://www.youtube.com/watch?v=lJwbPZGo05A) |
| Hand of Straights | Medium |  | [`hand-of-straights`](https://leetcode.com/problems/hand-of-straights/) | [`amnrMCVd2YI`](https://www.youtube.com/watch?v=amnrMCVd2YI) |
| Merge Triplets to Form Target Triplet | Medium |  | [`merge-triplets-to-form-target-triplet`](https://leetcode.com/problems/merge-triplets-to-form-target-triplet/) | [`kShkQLQZ9K4`](https://www.youtube.com/watch?v=kShkQLQZ9K4) |
| Partition Labels | Medium |  | [`partition-labels`](https://leetcode.com/problems/partition-labels/) | [`B7m8UmZE-vw`](https://www.youtube.com/watch?v=B7m8UmZE-vw) |
| Valid Parenthesis String | Medium |  | [`valid-parenthesis-string`](https://leetcode.com/problems/valid-parenthesis-string/) | [`QhPdNS143Qg`](https://www.youtube.com/watch?v=QhPdNS143Qg) |

### 16. Intervals (6)

- **Visual idea:** A timeline view: intervals as horizontal bars on a shared axis, merged ones changing colour. Meeting Rooms II: a heap of end times.
- **Link to:** none

| Problem | Difficulty | Blind 75 | LeetCode slug | NeetCode video |
|---|---|---|---|---|
| Insert Interval | Medium | Yes | [`insert-interval`](https://leetcode.com/problems/insert-interval/) | [`A8NUOmlwOlM`](https://www.youtube.com/watch?v=A8NUOmlwOlM) |
| Merge Intervals | Medium | Yes | [`merge-intervals`](https://leetcode.com/problems/merge-intervals/) | [`44H3cEC2fFM`](https://www.youtube.com/watch?v=44H3cEC2fFM) |
| Non Overlapping Intervals | Medium | Yes | [`non-overlapping-intervals`](https://leetcode.com/problems/non-overlapping-intervals/) | [`nONCGxWoUfM`](https://www.youtube.com/watch?v=nONCGxWoUfM) |
| Meeting Rooms | Easy | Yes | [`meeting-rooms`](https://leetcode.com/problems/meeting-rooms/) | [`PaJxqZVPhbg`](https://www.youtube.com/watch?v=PaJxqZVPhbg) |
| Meeting Rooms II | Medium | Yes | [`meeting-rooms-ii`](https://leetcode.com/problems/meeting-rooms-ii/) | [`FdzJmTCVyJU`](https://www.youtube.com/watch?v=FdzJmTCVyJU) |
| Minimum Interval to Include Each Query | Hard |  | [`minimum-interval-to-include-each-query`](https://leetcode.com/problems/minimum-interval-to-include-each-query/) | [`5hQ5WWW5awQ`](https://www.youtube.com/watch?v=5hQ5WWW5awQ) |

### 17. Math & Geometry (8)

- **Visual idea:** Rotate Image and Spiral Matrix: the grid view with arrows. The rest are mostly rows and variables.
- **Link to:** `rotateImage`, `spiralMatrix` (existing visualizers)

| Problem | Difficulty | Blind 75 | LeetCode slug | NeetCode video |
|---|---|---|---|---|
| Rotate Image | Medium | Yes | [`rotate-image`](https://leetcode.com/problems/rotate-image/) | [`fMSJSS7eO1w`](https://www.youtube.com/watch?v=fMSJSS7eO1w) |
| Spiral Matrix | Medium | Yes | [`spiral-matrix`](https://leetcode.com/problems/spiral-matrix/) | [`BJnMZNwUk1M`](https://www.youtube.com/watch?v=BJnMZNwUk1M) |
| Set Matrix Zeroes | Medium | Yes | [`set-matrix-zeroes`](https://leetcode.com/problems/set-matrix-zeroes/) | [`T41rL0L3Pnw`](https://www.youtube.com/watch?v=T41rL0L3Pnw) |
| Happy Number | Easy |  | [`happy-number`](https://leetcode.com/problems/happy-number/) | [`ljz85bxOYJ0`](https://www.youtube.com/watch?v=ljz85bxOYJ0) |
| Plus One | Easy |  | [`plus-one`](https://leetcode.com/problems/plus-one/) | [`jIaA8boiG1s`](https://www.youtube.com/watch?v=jIaA8boiG1s) |
| Pow(x, n) | Medium |  | [`powx-n`](https://leetcode.com/problems/powx-n/) | [`g9YQyYi4IQQ`](https://www.youtube.com/watch?v=g9YQyYi4IQQ) |
| Multiply Strings | Medium |  | [`multiply-strings`](https://leetcode.com/problems/multiply-strings/) | [`1vZswirL8Y8`](https://www.youtube.com/watch?v=1vZswirL8Y8) |
| Detect Squares | Medium |  | [`detect-squares`](https://leetcode.com/problems/detect-squares/) | [`bahebearrDc`](https://www.youtube.com/watch?v=bahebearrDc) |

### 18. Bit Manipulation (7)

- **Visual idea:** A bit row (32 or 8 cells of 0/1) under each number, with XOR / AND / shifts shown cell by cell.
- **Link to:** none

| Problem | Difficulty | Blind 75 | LeetCode slug | NeetCode video |
|---|---|---|---|---|
| Single Number | Easy |  | [`single-number`](https://leetcode.com/problems/single-number/) | [`qMPX1AOa83k`](https://www.youtube.com/watch?v=qMPX1AOa83k) |
| Number of 1 Bits | Easy | Yes | [`number-of-1-bits`](https://leetcode.com/problems/number-of-1-bits/) | [`5Km3utixwZs`](https://www.youtube.com/watch?v=5Km3utixwZs) |
| Counting Bits | Easy | Yes | [`counting-bits`](https://leetcode.com/problems/counting-bits/) | [`RyBM56RIWrM`](https://www.youtube.com/watch?v=RyBM56RIWrM) |
| Reverse Bits | Easy | Yes | [`reverse-bits`](https://leetcode.com/problems/reverse-bits/) | [`UcoN6UjAI64`](https://www.youtube.com/watch?v=UcoN6UjAI64) |
| Missing Number | Easy | Yes | [`missing-number`](https://leetcode.com/problems/missing-number/) | [`WnPLSRLSANE`](https://www.youtube.com/watch?v=WnPLSRLSANE) |
| Sum of Two Integers | Medium | Yes | [`sum-of-two-integers`](https://leetcode.com/problems/sum-of-two-integers/) | [`gVUrDV4tZfY`](https://www.youtube.com/watch?v=gVUrDV4tZfY) |
| Reverse Integer | Medium |  | [`reverse-integer`](https://leetcode.com/problems/reverse-integer/) | [`HAgLH58IgJQ`](https://www.youtube.com/watch?v=HAgLH58IgJQ) |
## New views the remaining categories need

The step view (`frontend/src/components/patterns/StepView.tsx`) currently draws array rows, a hash map card, a 9×9 grid, bars (with water, a container box, a rectangle and a floor) and variables. The categories left will need:

| View | Needed by | Notes |
|---|---|---|
| Linked list (boxes and arrows, named pointers) | Linked List | ✅ Done: `step.links` (`LinkView.tsx`), nodes on a row/column grid. Could also serve small graphs. |
| Binary tree (nodes by depth, a value per node) | Trees, Heap | Show each node's return value for recursive problems. |
| Trie | Tries | Could share the tree view. |
| Grid of any size | Graphs, Backtracking, 2-D DP, Tries | ✅ Done: `grid.blocks` adds Sudoku-style gaps. |
| Small graph (nodes and edges, weights) | Graphs, Advanced Graphs | Fixed layouts per example are fine. |
| Recursion tree | Backtracking | Branches for choices, dead ends crossed out. |
| Timeline | Intervals | Intervals as bars on one axis. |
| Bit row | Bit Manipulation | 8 or 32 cells of 0/1. |

## How to add a category (checklist)

Follow the four categories already built (e.g. `frontend/src/lib/patterns/stack/`).

1. **Python solutions** in `frontend/src/lib/guides/python/neetcode/<name>.py`. Use NeetCode's approach, written in our own words, with a docstring and two example prints. Run each file once.
2. **One problem file per problem** in `frontend/src/lib/patterns/<category>/`, exporting a `PatternProblem` (`frontend/src/lib/patterns/types.ts`):
   - `slug` and `video` from the tables above, `statement` in our own words, 2–3 `examples` (check each has exactly one valid answer when the problem says so), `random(seed)`, and a `big` input of about 200 items.
   - `run(input)` returns the animation steps. The first step of every example must be the guide's first stage, and the last step must be `done` with an `answer`.
   - `solve` must be **independent** of `run` (a slow, obviously correct way), and `brute` counts its operations.
   - `guide` holds the stages, legend, complexity, pitfalls and the Python file (imported with `?raw`).
3. **`index.ts`** exporting the list in NeetCode's order, plus a `<category>.test.ts` with known LeetCode answers and checks for anything the generic tests don't cover (list answers, explanations that quote numbers).
4. **Add the category to** `frontend/src/lib/patterns/patterns.test.ts` (the `ALL` list). This runs brute-force agreement on 300 random inputs, checks that every stage is reached, and checks that the pattern does under half the brute-force work at scale.
5. **Python checks:** add a section to `frontend/scripts/check_guide_solutions.py`, before `if failures:`, testing each solution against an independent answer on 200–300 random cases.
6. **Page:** `frontend/src/components/patterns/<Category>Page.tsx` with three `ConceptFigures`, a "How to spot it" card and a second card, wrapped in `PatternPage`.
7. **Register it:**
   - a lazy import and a `VISUALIZER_ROUTES` entry in `frontend/src/App.tsx`;
   - an entry under `interviewPatterns` and in the `VisualizationKey` union in `frontend/src/components/homepage/catalog.tsx`;
   - the key in the `VISUALIZERS` list in `frontend/scripts/ui-consistency-check.mjs`.

   Pick a key that isn't taken (e.g. `stackPattern`, because `stack` is the data-structure page).

## Checks before every push

Run from `frontend/`:

```bash
npx tsc -b
npx eslint src                      # 0 errors (warnings are pre-existing)
node scripts/controls-lint.mjs
npx vitest run
python3 scripts/check_guide_solutions.py
VITE_SUPABASE_URL=https://x.supabase.co VITE_SUPABASE_ANON_KEY=dummy npx vite build
npx vite preview --port 4173 &
ORIGIN=http://localhost:4173 node scripts/ui-consistency-check.mjs
```

Then take screenshots (Playwright, installed with `npm i --no-save playwright` and removed with `npm prune`). Check that the phone width (390px) doesn't scroll sideways. Review the screenshots before pushing.

## Credit rules

- The problem list and order come from the NeetCode 150 ([neetcode.io/roadmap](https://neetcode.io/roadmap)); the data comes from NeetCode's public repo ([neetcode-gh/leetcode](https://github.com/neetcode-gh/leetcode), MIT licence).
- Every problem links to NeetCode's video and to LeetCode. The credits section at the bottom of each page (in `PatternPage`) says the approaches follow NeetCode, while the animations, explanations and code were written for CodeQuest.
- Problem statements are summarised in our own words, never copied from LeetCode.

## Lessons from the first six categories

- **Check that examples have one answer.** Two Sum and Two Sum II examples once had two valid pairs. Tests now check this.
- **Tiny inputs can make brute force look better.** That's why every problem has a `big` input and an at-scale comparison.
- **Explanations must quote true numbers.** Character Replacement once claimed a count of 3 when the real count was 2 (NeetCode's stale `maxf` trick). Explain tricks like that, and test any number an explanation quotes.
- **Long titles overflow on phones** unless grid items have `min-w-0`.
- **Bars of similar values look identical when drawn from zero.** Use `bars.floor`.
- **Highlight what the data means**, not just an index. In Largest Rectangle, highlight the bar a stack entry's height came from.
- **Make “ruled out” obvious.** Faded (idle) cells must look clearly different from cells still in play; binary search depends on seeing the range halve.
- **Examples should show the idea.** An example that finds the target on the first guess teaches nothing.
- **Test the picture, not just the answer.** For linked lists, following the drawn arrows on the last step must spell out the answer, and no node may have two next arrows.
- **Labels need a halo** when arrows can pass under them.
