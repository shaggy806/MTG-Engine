import { defineCard } from "../define.js";

export default defineCard({
  name: "Bonecaller Cleric",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 1,
  text: "{3}{B}, Sacrifice this creature: Return target creature card from your graveyard to the battlefield. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{3}{B}", tap: false, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: "{3}{B}, Sacrifice this creature: Return target creature card from your graveyard to the battlefield. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
