import heapq
from collections import defaultdict


class Twitter:
    """Each user's tweets in posting order; a feed merges the newest tweets
    of the user and their followees with a heap, stopping after 10."""

    def __init__(self):
        self.count = 0  # goes down, so the newest tweet has the smallest count
        self.tweets = defaultdict(list)  # user -> [[count, tweetId], ...]
        self.follows = defaultdict(set)

    def postTweet(self, userId, tweetId):
        self.tweets[userId].append([self.count, tweetId])
        self.count -= 1

    def getNewsFeed(self, userId):
        res, heap = [], []
        for f in self.follows[userId] | {userId}:
            if self.tweets[f]:
                i = len(self.tweets[f]) - 1
                count, tid = self.tweets[f][i]
                heap.append([count, tid, f, i - 1])
        heapq.heapify(heap)
        while heap and len(res) < 10:
            count, tid, f, i = heapq.heappop(heap)
            res.append(tid)
            if i >= 0:  # push this user's next older tweet
                count, tid = self.tweets[f][i]
                heapq.heappush(heap, [count, tid, f, i - 1])
        return res

    def follow(self, followerId, followeeId):
        if followerId != followeeId:
            self.follows[followerId].add(followeeId)

    def unfollow(self, followerId, followeeId):
        self.follows[followerId].discard(followeeId)


t = Twitter()
t.postTweet(1, 5)
print(t.getNewsFeed(1))  # [5]
t.follow(1, 2)
t.postTweet(2, 6)
print(t.getNewsFeed(1))  # [6, 5]
t.unfollow(1, 2)
print(t.getNewsFeed(1))  # [5]
