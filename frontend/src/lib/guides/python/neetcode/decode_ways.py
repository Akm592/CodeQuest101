def num_decodings(s):
    """dp[i] = ways to decode s[i:]. One digit (not 0) adds dp[i + 1]; two
    digits from 10 to 26 add dp[i + 2]."""
    dp = {len(s): 1}
    for i in range(len(s) - 1, -1, -1):
        if s[i] == "0":
            dp[i] = 0
        else:
            dp[i] = dp[i + 1]
            if i + 1 < len(s) and (s[i] == "1" or (s[i] == "2" and s[i + 1] in "0123456")):
                dp[i] += dp[i + 2]
    return dp[0]


print(num_decodings("226"), num_decodings("06"))  # 3 0
