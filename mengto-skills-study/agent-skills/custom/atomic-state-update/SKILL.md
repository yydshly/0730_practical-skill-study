---
name: atomic-state-update
description: Use when implementing any bidirectional state transfer — inventory moves, auth sessions, form wizards, cart checkout, toggle states, or resource allocation. Make every transfer: validate → compute → commit-or-reject → persist. Never mutate state before confirming the destination is valid.
---

# Atomic State Update

Make every state mutation a transaction, not a sequence of mutations with a gap in the middle.

## When to use

- Inventory, loot, or resource systems (game dev, e-commerce)
- Authentication sessions (login, logout, token refresh)
- Cart operations (add, remove, update quantity, checkout)
- Any toggle, switch, or flip-flop state (bookmark, favorite, follow)
- Form wizards where completing one step commits partial state
- Reservation or booking systems where double-booking is possible

## 1. Define the state model

Separate your state into layers:

```
Source of truth:    authoritative data — item definitions, user records
Runtime state:      current session — inventory slots, cart items
Pending state:      in-flight changes — not yet committed
```

The source of truth is read-only at runtime. Runtime state is derived from source of truth + pending state, never the reverse.

## 2. Implement transfers as transactions

For any transfer operation:

```js
async function transfer(from, to, payload) {
  // 1. Validate — check before touching anything
  const sourceValid = await validateSource(from, payload);
  if (!sourceValid) throw new TransferError('INVALID_SOURCE');

  const destValid = await validateDestination(to, payload);
  if (!destValid) throw new TransferError('INVALID_DESTINATION');

  // 2. Compute — calculate the next state without committing
  const nextState = computeNextState(from, to, payload);

  // 3. Commit or Reject — atomic decision
  const isValid = validateComputedState(nextState);
  if (!isValid) throw new TransferError('INVALID_STATE');

  // 4. Persist — only after confirmed valid
  await persistState(nextState);

  return nextState;
}
```

## 3. Never do this

```
❌ removeItem(itemId)          // mutating before destination confirmed
   .then(added => addToSlot())
   .catch(rollback())          // rollback is complex and error-prone

❌ // Or worse:
   removeItem(itemId);         // synchronous, no rollback path
   addToSlot(slot);
```

## 4. Preserve identity across transfers

Item IDs must be stable across a swap. If item A moves from slot 1 to slot 2, the item is still item A — its ID does not change.

```js
// Item A moves from slot 1 → slot 2
// After transfer: slot1 = null, slot2 = item A (same ID)
```

If an item is consumed (e.g., a potion), that is an explicit consumption rule, not a transfer failure.

## 5. Handle concurrent edits

```
User A clicks "equip" on slot 3  ──┐
                                  ├── Both see slot 3 = item X
User B clicks "unequip" on slot 3 ┘
                        └── One wins, one gets: "slot was modified"
```

Use optimistic locking or event ordering to resolve the race:
- Timestamp: last write wins with a user-visible conflict message
- Version number: fail the second write with a conflict notification
- Event queue: serialize operations and process one at a time

## 6. Test the boundaries

```
✅ Valid source + valid destination → success
✅ Valid source + full destination  → rejection with clear message
✅ Invalid source (not owned)        → rejection, no state change
✅ Concurrent edit                  → one wins, one gets conflict
✅ Mid-transfer interruption        → state unchanged (no partial commit)
✅ Rapid double-click               → only one transfer executes
✅ Cart checkout edge case          → stock deducted atomically
```

## Quality bar

- Every transfer is atomic: complete or no state change, never partial
- No operation removes an item before confirming the destination is valid
- Concurrent edits are handled with a visible conflict message, not silent loss
- Item identity is preserved across swaps (stable ID)
- The system can recover from interruption mid-transfer without corruption

## Pitfalls

- **Split mutation**: removing from source before confirming destination — causes item loss on failure
- **No conflict detection**: two operations racing, both succeed, one overwrites the other
- **Implicit rollback**: relying on catching exceptions to undo partial state — complex and fragile
- **Copying source of truth**: duplicating item definition data into runtime state, leading to stale data on source updates
- **Ignoring rapid re-submission**: double-clicking a button causes double transfer
- **No identity preservation**: item gets a new ID on transfer, breaking downstream references
