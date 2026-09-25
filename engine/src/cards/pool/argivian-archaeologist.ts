import { defineCard } from "../define.js";

export default defineCard({
  name: "Argivian Archaeologist",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 1,
  toughness: 1,
  text: "{W}{W}, {T}: Return target artifact card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: "{W}{W}", tap: true },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{W}{W}, {T}: Return target artifact card from your graveyard to your hand.",
    },
  ],
});
