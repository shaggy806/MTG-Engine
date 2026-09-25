import { defineCard } from "../define.js";

export default defineCard({
  name: "Atzocan Seer",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 2,
  toughness: 3,
  text: "{T}: Add one mana of any color.\nSacrifice this creature: Return target Dinosaur card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { subtype: "Dinosaur" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "Sacrifice this creature: Return target Dinosaur card from your graveyard to your hand.",
    },
  ],
});
