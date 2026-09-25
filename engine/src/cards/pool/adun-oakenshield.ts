import { defineCard } from "../define.js";

export default defineCard({
  name: "Adun Oakenshield",
  manaCost: "{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 1,
  toughness: 2,
  text: "{B}{R}{G}, {T}: Return target creature card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: "{B}{R}{G}", tap: true },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{B}{R}{G}, {T}: Return target creature card from your graveyard to your hand.",
    },
  ],
});
