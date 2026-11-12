def find_duplicate(nums):
    """n + 1 numbers, each from 1 to n: find the repeated one in O(1) extra
    space. Treat index i as a node pointing to nums[i]; the duplicate value
    is where two arrows meet, which is where a cycle starts. Floyd finds it."""
    slow = fast = 0
    while True:  # phase 1: meet somewhere in the cycle
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast:
            break
    slow2 = 0
    while True:  # phase 2: walking from the start meets slow at the cycle's entrance
        slow = nums[slow]
        slow2 = nums[slow2]
        if slow == slow2:
            return slow


print(find_duplicate([1, 3, 4, 2, 2]))  # 2
print(find_duplicate([3, 1, 3, 4, 2]))  # 3
