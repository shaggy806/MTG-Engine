import { defineCard } from "../define.js";

export default defineCard({
  name: "Doomed Necromancer",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric", "Mercenary"],
  power: 2,
  toughness: 2,
  text: "{B}, {T}, Sacrifice this creature: Return target creature card from your graveyard to the battlefield.",
  activated: [
    {
      cost: { mana: "{B}", tap: true, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: "{B}, {T}, Sacrifice this creature: Return target creature card from your graveyard to the battlefield.",
    },
  ],
});
