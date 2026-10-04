import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// EDHREC rank 2386.
//
// Rulings:
//   [2018-06-08] Together Forever's activated ability checks whether the target creature has a
//     counter on it as the ability is activated and as the ability resolves. If the creature loses
//     its counters later in the turn, the delayed triggered ability will still return it to its
//     owner's hand when it dies.
//   [2018-06-08] You can't put more than one +1/+1 counter on any one target using the support
//     action.
//   [2018-06-08] If a creature without counters receives enough -1/-1 counters to reduce its
//     toughness to 0 or less, Together Forever's ability can't be activated before state-based
//     actions put that creature into its owner's graveyard.
//   [2018-06-08] If some, but not all, targets for a spell become illegal, the remaining targets
//     are affected as appropriate. If all of a spell's targets become illegal, that spell doesn't
//     resolve.
//   [2018-06-08] Support can target a creature another player controls.
//   [2018-06-08] If a spell with support has other abilities that target creatures, those
//     abilities and the support ability can target the same creature.

const SUPPORT_TEXT = "When this enchantment enters, support 2. (Put a +1/+1 counter on each of up to two target creatures.)";
const RETURN_TEXT =
  "{1}: Choose target creature with a counter on it. When that creature dies this turn, return that card to its owner's hand.";

export default defineCard({
  name: "Together Forever",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${SUPPORT_TEXT}\n${RETURN_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      // A counter of any kind, checked as it's activated and as it resolves
      // (the rulings); any player's creature.
      targets: [{ kind: "permanent", filter: { type: "creature", counters: { compare: { op: "gte", n: 1 } } } }],
      effect: {
        kind: "delayed-trigger",
        // Fires even if the creature has lost its counters by then (the rulings).
        at: { leaves: 0, to: ["graveyard"], thisTurn: true },
        effect: { kind: "return-to-hand", target: "trigger-object", from: "graveyard" },
        text: "When that creature dies this turn, return that card to its owner's hand.",
      },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      // Support N on a permanent: "each of up to N **other** target creatures"
      // (rule 701.41a) — any player's, one counter each (the rulings).
      targets: distinctTargets(2, { kind: "other", of: "creature" }, { optional: true }),
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          { kind: "add-counter", target: 1, counter: "+1/+1", amount: 1 },
        ],
      },
      resolve: null,
      text: SUPPORT_TEXT,
    },
  ],
});
