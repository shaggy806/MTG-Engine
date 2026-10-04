import { defineCard } from "../define.js";

// EDHREC rank 2828.
//
// Rulings:
//   [2023-11-10] If a permanent is sacrificed to pay a cost of a spell or ability, Carmen, Cruel
//     Skymarcher's second ability will resolve before that spell or ability. Conversely, if a
//     permanent is sacrificed during the resolution of a spell or ability, that spell or ability
//     will finish resolving before Carmen, Cruel Skymarcher's second ability is put onto the
//     stack.
//   [2023-11-10] If another effect causes Carmen, Cruel Skymarcher's power to be less than the
//     mana value of the target card as its last ability tries to resolve, the target is illegal.
//     You won't return the target card to the battlefield.
//   [2023-11-10] If you sacrifice Carmen, Cruel Skymarcher, its second ability will still trigger.

const SAC_TEXT = "Whenever a player sacrifices a permanent, put a +1/+1 counter on Carmen and you gain 1 life.";
const ATTACK_TEXT =
  "Whenever Carmen attacks, return up to one target permanent card with mana value less than or equal to Carmen's power from your graveyard to the battlefield.";

export default defineCard({
  name: "Carmen, Cruel Skymarcher",
  manaCost: "{3}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Soldier"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${SAC_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      // Any player, any permanent — Carmen herself included: a sacrifice is a
      // leave event, whose triggers look back in time (rule 603.10a; the ruling).
      trigger: { on: "sacrifice", who: "any" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: SAC_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      // The mana-value bound is re-read when the target is rechecked on
      // resolution, so a Carmen shrunk in response loses the target (the ruling).
      targets: [
        {
          kind: "optional",
          of: {
            kind: "card-in-graveyard",
            whose: "you",
            filter: {
              typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"],
              manaValue: { op: "lte", n: { amount: { powerOf: "source" } } },
            },
          },
        },
      ],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
