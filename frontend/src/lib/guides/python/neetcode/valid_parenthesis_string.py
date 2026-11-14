def check_valid_string(s):
    """Track the range of possible open-bracket counts: "(" raises both ends,
    ")" lowers both, "*" widens the range. Valid if 0 is possible at the end."""
    left_min, left_max = 0, 0
    for c in s:
        if c == "(":
            left_min, left_max = left_min + 1, left_max + 1
        elif c == ")":
            left_min, left_max = left_min - 1, left_max - 1
        else:
            left_min, left_max = left_min - 1, left_max + 1
        if left_max < 0:
            return False
        if left_min < 0:
            left_min = 0
    return left_min == 0


print(check_valid_string("(*))"), check_valid_string("(((*)"))  # True False
