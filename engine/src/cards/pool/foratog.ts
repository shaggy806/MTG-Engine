import { defineCard } from "../define.js";

export default defineCard({
  name: "Foratog",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Atog"],
  power: 1,
  toughness: 2,
  text: "{G}, Sacrifice a Forest: This creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: "{G}", tap: false, sacrifice: { filter: { subtype: "Forest" } } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{G}, Sacrifice a Forest: This creature gets +2/+2 until end of turn.",
    },
  ],
});
