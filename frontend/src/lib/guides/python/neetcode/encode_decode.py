def encode(strs):
    """Prefix every word with its length and a '#': ["ab", "c"] -> "2#ab1#c".
    Works for any characters, including '#' and digits."""
    return "".join(f"{len(s)}#{s}" for s in strs)


def decode(s):
    words, i = [], 0
    while i < len(s):
        j = i
        while s[j] != "#":  # read the length digits
            j += 1
        length = int(s[i:j])
        words.append(s[j + 1 : j + 1 + length])  # then exactly that many characters
        i = j + 1 + length
    return words


print(decode(encode(["neet", "code", "#4", ""])))  # ['neet', 'code', '#4', '']
