import { defineCard } from "../define.js";

export default defineCard({
  name: "Lotleth Giant",
  manaCost: "{6}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Giant"],
  power: 6,
  toughness: 5,
  text: "Undergrowth — When this creature enters, it deals 1 damage to target opponent for each creature card in your graveyard.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: {
        kind: "damage",
        amount: { countInGraveyard: { type: "creature", ownedBy: "you" } },
        target: 0,
      },
      resolve: null,
      text: "Undergrowth — When this creature enters, it deals 1 damage to target opponent for each creature card in your graveyard.",
    },
  ],
});
