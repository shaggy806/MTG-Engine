import { defineCard } from "../define.js";

// EDHREC rank 628. A die roll (rule 706): the result is the Treasure count.
const HIT =
  "Whenever this creature deals combat damage to a player, roll a d20. You create a number of Treasure tokens equal to the result.";

export default defineCard({
  name: "Ancient Copper Dragon",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elder", "Dragon"],
  power: 6,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${HIT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "roll-dice",
        sides: 20,
        then: { kind: "create-token", token: "Treasure Token", count: { roll: "total" } },
      },
      resolve: null,
      text: HIT,
    },
  ],
});
