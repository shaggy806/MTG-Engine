import { defineCard } from "../define.js";

export default defineCard({
  name: "Ertai, Wizard Adept",
  manaCost: "{2}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{2}{U}{U}, {T}: Counter target spell.",
  activated: [
    {
      cost: { mana: "{2}{U}{U}", tap: true },
      targets: ["spell"],
      effect: { kind: "counter", target: 0 },
      resolve: null,
      text: "{2}{U}{U}, {T}: Counter target spell.",
    },
  ],
});
