import { defineCard } from "../define.js";

export default defineCard({
  name: "Defiant Salvager",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Aetherborn", "Artificer"],
  power: 2,
  toughness: 2,
  text: "Sacrifice an artifact or creature: Put a +1/+1 counter on this creature. Activate only as a sorcery.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        sacrifice: { filter: { typesAnyOf: ["artifact", "creature"] } },
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Sacrifice an artifact or creature: Put a +1/+1 counter on this creature. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
