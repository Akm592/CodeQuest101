def letter_combinations(digits):
    """One level per digit, one branch per letter on that key."""
    keys = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl",
            "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}
    res = []

    def backtrack(i, cur):
        if len(cur) == len(digits):
            res.append(cur)
            return
        for c in keys[digits[i]]:
            backtrack(i + 1, cur + c)

    if digits:
        backtrack(0, "")
    return res


print(letter_combinations("23"))  # ['ad', 'ae', 'af', 'bd', 'be', 'bf', 'cd', 'ce', 'cf']
