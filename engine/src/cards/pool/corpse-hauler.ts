import { defineCard } from "../define.js";

export default defineCard({
  name: "Corpse Hauler",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 2,
  toughness: 1,
  text: "{2}{B}, Sacrifice this creature: Return target creature card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{2}{B}, Sacrifice this creature: Return target creature card from your graveyard to your hand.",
    },
  ],
});
