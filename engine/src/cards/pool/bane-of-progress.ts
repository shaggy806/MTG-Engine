import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, destroy all artifacts and enchantments. Put a +1/+1 counter on this creature for each permanent destroyed this way.";

// "Destroyed this way": an indestructible or regenerated one doesn't count,
// one destroyed but exiled instead (Rest in Peace) does (the rulings).
export default defineCard({
  name: "Bane of Progress",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "destroy-all", filter: { typesAnyOf: ["artifact", "enchantment"] } },
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: { thisWay: "destroyed" } },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
