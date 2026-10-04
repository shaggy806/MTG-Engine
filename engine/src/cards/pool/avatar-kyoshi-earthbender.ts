import { defineCard } from "../define.js";

// EDHREC rank 4331.
//
// Rulings:
//   [2025-10-02] "Earthbend N" means "Target land you control becomes a 0/0 land creature with
//     haste in addition to its other types. Put N +1/+1 counters on it. When it dies or is exiled,
//     return it to the battlefield tapped under your control."
//   [2025-10-02] You may target a land that is already a creature, perhaps because of a previous
//     earthbend ability. The land will get the +1/+1 counters, gain haste, and have its base power
//     and toughness set to 0/0.
//   [2025-10-02] If the targeted land becomes an illegal target before the spell or ability that
//     includes earthbend resolves, earthbend does nothing. If the spell or ability didn't have
//     other targets, it won't resolve.

const HEXPROOF_TEXT = "During your turn, Avatar Kyoshi has hexproof.";
const COMBAT_TEXT = "At the beginning of combat on your turn, earthbend 8, then untap that land.";

export default defineCard({
  name: "Avatar Kyoshi, Earthbender",
  manaCost: "{5}{G}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Avatar"],
  power: 6,
  toughness: 6,
  text:
    `${HEXPROOF_TEXT}\n${COMBAT_TEXT} (Target land you control becomes a 0/0 creature with haste that's still ` +
    "a land. Put eight +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)",
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "your-turn" },
      grantKeywords: ["hexproof"],
      text: HEXPROOF_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: ["land-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "earthbend", target: 0, amount: 8 },
          { kind: "untap", target: 0 },
        ],
      },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
});
