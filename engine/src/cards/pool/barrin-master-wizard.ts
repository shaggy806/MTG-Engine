import { defineCard } from "../define.js";

export default defineCard({
  name: "Barrin, Master Wizard",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{2}, Sacrifice a permanent: Return target creature to its owner's hand.",
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: { filter: {} } },
      targets: ["creature"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "{2}, Sacrifice a permanent: Return target creature to its owner's hand.",
    },
  ],
});
