import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 4176.
//
// Rulings:
//   [2025-06-06] Multiple finality counters on a single permanent are redundant.
//   [2025-06-06] Finality counters work on any permanent, not only creatures. If a permanent with
//     a finality counter on it would be put into a graveyard from the battlefield, exile it
//     instead.
//   [2025-06-06] Finality counters don't stop permanents from going to zones other than the
//     graveyard from the battlefield. For example, if a permanent with a finality counter on it
//     would be put into its owner's hand from the battlefield, it does so normally.
//   [2025-06-06] Finality counters aren't keyword counters, and a finality counter doesn't give
//     any abilities to the permanent it's on. If that permanent loses its abilities and then would
//     go to a graveyard, it will still be exiled instead.

// "Yuna and enchantment creatures you control" is two statics — Yuna, and the
// other enchantment creatures — so an enchantment-creature Yuna still has one
// ward, not two. The return is Archon of Falling Stars' with Admiral Brass's
// finality counter; an Aura returned this way asks what it enchants.
const DURING_TEXT =
  "During your turn, Yuna and enchantment creatures you control have trample, lifelink, and ward {2}.";
const RETURN_TEXT =
  "At the beginning of your end step, return up to one target enchantment card from your graveyard to the battlefield with a finality counter on it.";

export default defineCard({
  name: "Yuna, Hope of Spira",
  manaCost: "{3}{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 3,
  toughness: 5,
  text: `${DURING_TEXT}\n${RETURN_TEXT} (If a permanent with a finality counter on it would be put into a graveyard from the battlefield, exile it instead.)`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "your-turn" },
      grantKeywords: ["trample", "lifelink"],
      grantsTriggered: [ward({ mana: "{2}" })],
      text: DURING_TEXT,
    },
    {
      affects: {
        scope: "filter",
        filter: { types: ["enchantment", "creature"], controlledBy: "you" },
        excludeSelf: true,
      },
      condition: { kind: "your-turn" },
      grantKeywords: ["trample", "lifelink"],
      grantsTriggered: [ward({ mana: "{2}" })],
      text: DURING_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [
        { kind: "optional", of: { kind: "card-in-graveyard", whose: "you", filter: { type: "enchantment" } } },
      ],
      effect: { kind: "put-onto-battlefield", target: 0, withCounters: { kind: "finality", amount: 1 } },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
