# Aqua Nest Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants & Master Source of Truth
- **Root Identity Gate (`/users/{userId}`)**: Every authenticated write requires `request.auth != null` and `request.auth.token.email_verified == true`. A user profile document at `/users/{userId}` can only be read, created, or updated when `request.auth.uid == userId` and `data.uid == userId`.
- **PII Split Isolation (`/users/{userId}/private/{docId}`)**: Personally Identifiable Information (`email`) is strictly isolated in `/users/{userId}/private/info` (`docId == 'info'`), requires parent existence (`existsAfter(/databases/$(database)/documents/users/$(userId))`), and rejects any access from non-owners.
- **Relational Subcollection Sync (`/users/{userId}/customProducts/{productId}` and `/users/{userId}/orders/{orderId}`)**:
  - Single-document writes (`create`, `update`, `delete`) require parent `/users/{userId}` existence (`exists(/databases/$(database)/documents/users/$(userId))`), valid document ID regex (`^[a-zA-Z0-9_\-]+$`, `<= 128` chars), and strict `ownerId == request.auth.uid && ownerId == userId`.
  - List queries (`allow list`) enforce `isVerifiedOwner(userId) && resource.data.ownerId == request.auth.uid` without `get()`/`exists()` inside `allow list` to prevent O(n) read amplification.
- **Terminal State Locking (`CloudOrder.status`)**: Once an order reaches terminal state `'Refunded'`, no further updates are permitted (`existing().status != 'Refunded'`).
- **Temporal & Immutable Integrity**: `createdAt == request.time` on `create`, `updatedAt == request.time` on `update`, and `createdAt`, `uid`, `id`, and `ownerId` are strictly immutable across updates.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return `PERMISSION_DENIED`)
1. **Unverified Email Spoof**: `auth.uid == 'user_1'`, `auth.token.email_verified == false` attempting `create` on `/users/user_1`.
2. **Cross-User Identity Spoof**: `auth.uid == 'attacker_9'` setting `ownerId: 'victim_1'` on `/users/victim_1/customProducts/p1`.
3. **Ghost / Shadow Field Injection**: Authenticated owner updating `/users/user_1` with `{ displayName: 'Aqua', isAdmin: true, updatedAt: request.time }`.
4. **ID Poisoning Attack**: Document ID containing 200 characters or special path characters (`p1$bad!id`) on `/users/user_1/customProducts/{productId}`.
5. **Orphaned Subcollection Write**: Creating `/users/user_1/customProducts/p1` when parent `/users/user_1` does not exist.
6. **PII Cross-Read Leak**: Authenticated `user_2` attempting `get` on `/users/user_1/private/info`.
7. **Unbounded String / Resource Exhaustion**: Uploading a `careNote` string of 5,000 characters (`> 500` maxLength) or `image` string `> 250,000` characters.
8. **Value Poisoning on Whitelisted Update Key**: Updating `price` on `customProducts/p1` with `"free"` (string instead of non-negative number).
9. **Immutable Field Tampering**: Updating `createdAt` or `ownerId` on `/users/user_1/orders/ORD-1003`.
10. **Client-Forged Timestamp**: Creating `/users/user_1/orders/ORD-1003` with a past/future `createdAt` != `request.time`.
11. **Terminal State Bypass**: Updating `/users/user_1/orders/ORD-1003` after `existing().status == 'Refunded'`.
12. **Unscoped List Scraping**: Attempting `list` on `/users/victim_1/orders` while signed in as `attacker_9`.
