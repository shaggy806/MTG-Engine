import { defineCard } from "../define.js";

export default defineCard({
  name: "Ceta Disciple",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{R}, {T}: Target creature gets +2/+0 until end of turn.\n{G}, {T}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: "{R}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{R}, {T}: Target creature gets +2/+0 until end of turn.",
    },
    {
      cost: { mana: "{G}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{G}, {T}: Add one mana of any color.",
    },
  ],
});
