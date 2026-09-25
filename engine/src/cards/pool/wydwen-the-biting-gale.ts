import { defineCard } from "../define.js";

export default defineCard({
  name: "Wydwen, the Biting Gale",
  manaCost: "{2}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Faerie", "Wizard"],
  power: 3,
  toughness: 3,
  keywords: ["flash", "flying"],
  text: "Flash\nFlying\n{U}{B}, Pay 1 life: Return Wydwen to its owner's hand.",
  activated: [
    {
      cost: { mana: "{U}{B}", tap: false, payLife: 1 },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "{U}{B}, Pay 1 life: Return Wydwen to its owner's hand.",
    },
  ],
});
