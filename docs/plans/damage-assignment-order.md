# Combat damage without a damage assignment order

**Status:** proposed (2026-09-22), not started. Documented at the user's
request so the engine work can be picked up later: "Document the need to
update damage assignment but don't do anything more." The engine still runs
the pre-2024 rules described below.

## The rules now

*Magic: The Gathering Foundations* (November 2024) removed damage assignment
order from the game. Checked against the Comprehensive Rules effective
2026-09-25, whose glossary now lists "Damage Assignment Order (Obsolete)":

- **509 (declare blockers)** has no ordering step any more. 509.1 declares
  blockers, then 509.2 is simply "the active player gets priority". The old
  509.2 (the attacking player orders each multi-blocked attacker's blockers)
  and 509.3 (the defender orders a multi-blocking creature's attackers) are
  gone.
- **510.1c.** A blocked creature blocked by two or more creatures "assigns
  its combat damage to those creatures divided as its controller chooses
  among them". There is no "lethal to the first before the next". A 3/3
  blocked by two creatures may put all 3 on either one, or split 2/1.
- **510.1d.** The same freedom for a creature blocking several attackers.
- **510.1e.** Legality is checked once, over the whole assignment.
- **702.19b (trample).** Excess may go to the player, planeswalker or battle
  being attacked only "once all those blocking creatures are assigned lethal
  damage". Damage already marked counts toward lethal. Otherwise the
  controller "need not assign lethal damage to all those blocking creatures
  but in that case can't assign any damage to the player".
- **702.2c (deathtouch).** Any nonzero damage from a deathtouch source counts
  as lethal. So deathtouch plus trample can put 1 on each blocker and the rest
  on the player, the same as before.
- **702.19d.** A blocked trampler with no blockers left when damage is
  assigned assigns everything to the player or planeswalker.

Sources: [Foundations Update Bulletin](https://magic.wizards.com/en/news/announcements/foundations-update-bulletin);
[Comprehensive Rules](https://magic.wizards.com/en/rules) (TXT, 2026-09-25).

## What the engine does today

It implements the old rules end to end:

- **An `order-blockers` decision** (`engine/src/decisions/order-blockers.ts`).
  After blocks, every multi-blocked attacker queues in
  `state.pendingBlockerOrders`. `Game.promptNextBlockerOrder` raises the
  decisions one at a time, and `Game.applyBlockerOrder` rewrites the
  attacker's `blockedBy` into the chosen order.
- **The old 510.1c validator.** `damageAssignmentViolations`
  (`engine/src/combat/damage.ts`) rejects any amount on a blocker, or trampled
  over, unless every *earlier* blocker in that order has lethal ("each earlier
  blocker must be assigned lethal damage first"). A 1/5 split against two 2/2s
  without trample is legal now, but the engine refuses it.
- **`standardAssignment`**, the single default split used by auto-assign, by
  every controller's default answer, as the fuzzer's starting point and as the
  client's initial split. It assigns lethal down the order, then puts the
  remainder on the last blocker or tramples it over.
- **`needsDamageAssignmentChoice`** asks the player only when power exceeds
  the damage the order forces. Otherwise the engine assigns without asking.
- **The client** has an `order-blockers` mode ("Order X's blockers — click
  them in the order they take damage"). Its damage bar seeds from
  `standardAssignment` and enables Confirm off `damageAssignmentViolations`.
- **Controllers:** `PlayerController.orderBlockers` and
  `assignCombatDamage` (`engine/src/controller.ts`), plus `ScriptedController`'s
  `orderBlockersFn`.

## The change

1. **Delete the `order-blockers` decision kind** (17 kinds become 16). That
   means the module; its entries in `decisions/contract.ts` and
   `decisions/registry.ts`; the `order-blockers` `Action` and `LegalAction`
   variants (`actions.ts`); the `AwaitingDecision` variant and
   `pendingBlockerOrders` (`state.ts`); `promptNextBlockerOrder` and
   `applyBlockerOrder`, including the `DecisionHost` delegate (`game.ts`); and
   `orderBlockers` on the controllers. `blockedBy` keeps declaration order,
   which no longer means anything to the rules.
2. **Rewrite `damageAssignmentViolations` to 510.1c and 702.19b.** Amounts are
   non-negative integers, and together with any trample-over they sum to the
   attacker's power. Without trample, any division among the blockers is
   legal. With trample, damage may go over only if every blocker has at least
   its `lethalFor` (1 for deathtouch, net of marked damage). The client
   already calls this function, so its Confirm button follows automatically.
3. **`needsDamageAssignmentChoice`.** Two or more live blockers is always a
   real choice now. A lone blocker is a choice only with trample and power
   above its lethal.
4. **Choose a default split.** With no order to follow, `standardAssignment`
   needs a policy for auto-assign, the bots and the client's starting point.
   Suggested: kill as many blockers as possible (fewest-lethal first, ties in
   declaration order). Then send the excess over with trample, or put it on
   the next blocker without.
5. **Client.** Remove the `order-blockers` mode and its label. The damage bar
   keeps its per-blocker inputs, but will come up more often (any
   multi-block), so its default should be the new policy.
6. **Bots.** Both `decisions/` modules opt out of candidate search on the
   grounds that "v1's lethal-in-order split is already the right answer".
   Once any split is legal, which blocker to kill becomes a real choice.
   Consider letting v2 score a few splits.
7. **Tests and scripts.** `test/combat.test.ts` and
   `scripts/combat-demo.mjs`/`keywords-demo.mjs` set `orderBlockersFn`.
   `test/seam.test.ts` walks an `order-blockers` decision.
   `test/decisions/registry.test.ts` has its fixture. New cases to add: a 1/5
   split with no trample is legal; with trample, 2/2 plus 2 over is legal but
   1/2 plus 3 over isn't; deathtouch plus trample may put 1 on each blocker and
   the rest over; a blocker already dealt first-strike damage needs only its
   remaining toughness in the regular step.
8. **Docs.** Update CLAUDE.md's decision-kind list and count, and the note in
   `protocol/src/room.ts` that names `order-blockers`.

Removing the `order-blockers` arm of `randomAnswerFor` changes the fuzzer's
draw sequence, so every seed replays differently afterwards (CLAUDE.md,
`controller.ts`). That's expected, not a regression.

## Out of scope

- **A creature blocking several attackers (510.1d).** `GameObject.blocking`
  is a single `ObjectId`, and no card in the pool grants extra blocks, so the
  case doesn't arise. It becomes a real split once such a card is authored.
- **Trample over planeswalkers (702.19c).** Not modeled, and no pool card
  has it.
