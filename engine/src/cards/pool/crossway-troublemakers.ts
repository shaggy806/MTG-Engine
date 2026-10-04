import { defineCard } from "../define.js";

// EDHREC rank 3645.
//
// Rulings:
//   [2021-11-19] You may pay 2 life only once for each Vampire that dies. You can't pay multiple
//     times for the same triggered ability and draw multiple cards.
//
// Blade Historian's attacking-creatures grant, narrowed to Vampires; the
// trigger's optional life payment is a `may` with `costLife`.

const GRANT_TEXT =
  "Attacking Vampires you control have deathtouch and lifelink. (Any amount of damage they deal to a creature is enough to destroy it. Damage dealt by those creatures also causes their controller to gain that much life.)";
const DIES_TEXT = "Whenever a Vampire you control dies, you may pay 2 life. If you do, draw a card.";

export default defineCard({
  name: "Crossway Troublemakers",
  manaCost: "{5}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 5,
  toughness: 5,
  text: `${GRANT_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", subtype: "Vampire", attacking: true, controlledBy: "you" },
      },
      grantKeywords: ["deathtouch", "lifelink"],
      text: GRANT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { subtype: "Vampire" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay 2 life to draw a card?",
        costLife: 2,
        effect: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
