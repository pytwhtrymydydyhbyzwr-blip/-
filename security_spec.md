# Security Specification & Threat Model

## 1. Data Invariants
- Users can only read and write their own user profile document `/users/{userId}` and subcollections `/users/{userId}/...`.
- Habits `/users/{userId}/habits/{habitId}` belong strictly to the authenticated `userId`.
- Gamification stats `/users/{userId}/gamification/stats` can only be read/updated by the profile owner `userId`.
- Feed items `/feed/{feedItemId}` can be read by any signed-in user, but created only by the authenticated author (`request.auth.uid == incoming().userId`).
- Updating feed items is restricted or disallowed unless adding kudos.
- All IDs must be string identifiers up to 128 characters without path traversal characters.

## 2. Dirty Dozen Payloads (Negative Test Payloads)
1. Modifying another user's habit document `/users/userB/habits/h1`.
2. Spoofing `userId` in feed items (`userId: 'userB'` while authed as `userA`).
3. Injecting 1MB payload string into habit name.
4. Injecting path traversal characters into document ID (`../../admin`).
5. Overwriting another user's gamification stats `/users/userB/gamification/stats`.
6. Reading private user subcollections of another user without authentication.
7. Unauthenticated create attempt on `/feed/item1`.
8. Updating `createdAt` or `userId` on existing habit (immutable fields).
9. Creating user profile with extra unvalidated fields (`isAdmin: true`).
10. Unauthenticated read attempt on `/users/{userId}`.
11. Setting negative XP values in gamification stats.
12. Creating feed items with empty required fields (`userName: ''`).
