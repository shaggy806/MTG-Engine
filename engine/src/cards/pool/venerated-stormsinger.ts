import { defineCard } from "../define.js";
import { mobilize, thisOrAnother } from "../helpers.js";

// EDHREC rank 5468.
// Makes Warrior → use "Red Warrior Token".
//
// Rulings:
//   [2025-04-04] You choose the player, planeswalker, or battle each Warrior token is attacking.
//     They don’t all have to attack the same one, and they don’t have to attack the same player,
//     planeswalker, or battle as the creature with mobilize.
//   [2025-04-04] Although the Warrior tokens enter as attacking creatures, they were never
//     declared as attacking creatures. Abilities that trigger whenever a creature attacks won’t
//     trigger when the tokens enter attacking.

const MOBILIZE_TEXT =
  "Mobilize 1 (Whenever this creature attacks, create a tapped and attacking 1/1 red Warrior creature token. Sacrifice it at the beginning of the next end step.)";
const DRAIN_TEXT =
  "Whenever this creature or another creature you control dies, each opponent loses 1 life and you gain 1 life.";

export default defineCard({
  name: "Venerated Stormsinger",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Orc", "Cleric"],
  power: 3,
  toughness: 3,
  text: `${MOBILIZE_TEXT}\n${DRAIN_TEXT}`,
  triggered: [
    mobilize(1),
    ...thisOrAnother({
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: DRAIN_TEXT,
    }),
  ],
});
