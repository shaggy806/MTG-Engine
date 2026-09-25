import { defineCard } from "../define.js";

export default defineCard({
  name: "Vampire Soulcaller",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Warlock"],
  power: 3,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nThis creature can't block.\nWhen this creature enters, return target creature card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "When this creature enters, return target creature card from your graveyard to your hand.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "This creature can't block.",
    },
  ],
});
