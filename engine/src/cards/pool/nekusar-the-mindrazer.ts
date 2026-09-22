import { defineCard } from "../define.js";

// Top-commanders rank 21. Both abilities are "that player": the first is
// whoever's draw step it is (`"active-player"`), the second whoever drew the
// card that fired it (`"trigger-controller"` — the drawn card is the trigger
// object of a `draws` trigger). Neither is a target, so a hexproof player
// still draws the extra card and still takes the damage.
export default defineCard({
  name: "Nekusar, the Mindrazer",
  manaCost: "{2}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 2,
  toughness: 4,
  text:
    "At the beginning of each player's draw step, that player draws an additional card.\n" +
    "Whenever an opponent draws a card, Nekusar deals 1 damage to that player.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "draw", who: "any" },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "active-player" },
      resolve: null,
      text: "At the beginning of each player's draw step, that player draws an additional card.",
    },
    {
      trigger: { on: "draws", who: "opponent" },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "trigger-controller" },
      resolve: null,
      text: "Whenever an opponent draws a card, Nekusar deals 1 damage to that player.",
    },
  ],
});
