import { defineCard } from "../define.js";

// EDHREC rank 5077.
//
// Rulings:
//   [2024-07-26] If Valley Mightcaller enters at the same time as one or more other Frogs,
//     Rabbits, Raccoons, or Squirrels you control, its second ability will trigger for each of
//     them.

const GROW_TEXT =
  "Whenever another Frog, Rabbit, Raccoon, or Squirrel you control enters, put a +1/+1 counter on this creature.";

export default defineCard({
  name: "Valley Mightcaller",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Frog", "Warrior"],
  power: 1,
  toughness: 1,
  keywords: ["trample"],
  text: `Trample\n${GROW_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtypes: ["Frog", "Rabbit", "Raccoon", "Squirrel"] },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GROW_TEXT,
    },
  ],
});
