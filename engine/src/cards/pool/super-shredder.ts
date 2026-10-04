import { defineCard } from "../define.js";

// EDHREC rank 5235.

const GROW_TEXT = "Whenever another permanent leaves the battlefield, put a +1/+1 counter on Super Shredder.";

export default defineCard({
  name: "Super Shredder",
  manaCost: "{1}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Ninja", "Human"],
  power: 1,
  toughness: 1,
  keywords: ["menace"],
  text: `Menace\n${GROW_TEXT}`,
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "any", otherOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GROW_TEXT,
    },
  ],
});
