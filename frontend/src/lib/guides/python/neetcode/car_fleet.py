def car_fleet(target, position, speed):
    """How many fleets reach the target. Go from the car closest to the target
    backwards; a car that would arrive no later than the fleet ahead of it
    catches up and joins it. O(n log n) for the sort."""
    cars = sorted(zip(position, speed), reverse=True)
    stack = []  # arrival time of each fleet's leader
    for p, s in cars:
        stack.append((target - p) / s)
        if len(stack) >= 2 and stack[-1] <= stack[-2]:
            stack.pop()  # catches the fleet ahead: joins it
    return len(stack)


print(car_fleet(12, [10, 8, 0, 5, 3], [2, 4, 1, 1, 3]))  # 3
