import { defineCard } from "../define.js";

export default defineCard({
  name: "Hana Kami",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text: "{1}{G}, Sacrifice this creature: Return target Arcane card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { subtype: "Arcane" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{1}{G}, Sacrifice this creature: Return target Arcane card from your graveyard to your hand.",
    },
  ],
});
