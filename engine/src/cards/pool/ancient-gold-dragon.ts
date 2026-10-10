import { defineCard } from "../define.js";

// EDHREC rank 2132.
const HIT =
  "Whenever this creature deals combat damage to a player, roll a d20. You create a number of 1/1 blue Faerie Dragon creature tokens with flying equal to the result.";

export default defineCard({
  name: "Ancient Gold Dragon",
  manaCost: "{5}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elder", "Dragon"],
  power: 7,
  toughness: 10,
  keywords: ["flying"],
  text: `Flying\n${HIT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "roll-dice",
        sides: 20,
        then: { kind: "create-token", token: "Faerie Dragon Token", count: { roll: "total" } },
      },
      resolve: null,
      text: HIT,
    },
  ],
});
