import { defineCard } from "../define.js";

// needed-cards P16. New: StaticAbility.extraLandsPerTurn.
export default defineCard({
  name: "Princess Sarah",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 1,
  toughness: 2,
  text: "You may play two additional lands on each of your turns.",
  static: [
    {
      affects: { scope: "self" },
      extraLandsPerTurn: 2,
      text: "You may play two additional lands on each of your turns.",
    },
  ],
});
