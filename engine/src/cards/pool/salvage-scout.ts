import { defineCard } from "../define.js";

export default defineCard({
  name: "Salvage Scout",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Scout"],
  power: 1,
  toughness: 1,
  text: "{W}, Sacrifice this creature: Return target artifact card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: "{W}", tap: false, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{W}, Sacrifice this creature: Return target artifact card from your graveyard to your hand.",
    },
  ],
});
