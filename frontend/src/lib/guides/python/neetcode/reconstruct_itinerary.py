def find_itinerary(tickets):
    """Sort the tickets and backtrack: from each airport take the first
    unused ticket; if that strands tickets, put it back and try the next."""
    adj = {src: [] for src, dst in tickets}
    for src, dst in sorted(tickets):
        adj[src].append(dst)
    res = ["JFK"]

    def dfs(src):
        if len(res) == len(tickets) + 1:
            return True
        if src not in adj:
            return False
        temp = list(adj[src])
        for i, v in enumerate(temp):
            adj[src].pop(i)
            res.append(v)
            if dfs(v):
                return True
            adj[src].insert(i, v)
            res.pop()
        return False

    dfs("JFK")
    return res


print(find_itinerary([["JFK", "SFO"], ["JFK", "ATL"], ["SFO", "ATL"], ["ATL", "JFK"], ["ATL", "SFO"]]))
# ['JFK', 'ATL', 'JFK', 'SFO', 'ATL', 'SFO']
