import { defineCard } from "../define.js";

const ENTER_TEXT =
  "When this creature enters, destroy all creatures with flying. Put a +1/+1 counter on this creature for each creature destroyed this way.";

// "Destroyed this way": an indestructible or regenerated flier doesn't count.
export default defineCard({
  name: "Whiptongue Hydra",
  manaCost: "{5}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Lizard", "Hydra"],
  power: 4,
  toughness: 4,
  keywords: ["reach"],
  text: `Reach\n${ENTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "destroy-all", filter: { type: "creature", keyword: "flying" } },
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: { thisWay: "destroyed" } },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
