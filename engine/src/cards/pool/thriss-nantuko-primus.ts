import { defineCard } from "../define.js";

export default defineCard({
  name: "Thriss, Nantuko Primus",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Insect", "Druid"],
  power: 5,
  toughness: 5,
  text: "{G}, {T}: Target creature gets +5/+5 until end of turn.",
  activated: [
    {
      cost: { mana: "{G}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 5, toughness: 5, duration: "end-of-turn" },
      resolve: null,
      text: "{G}, {T}: Target creature gets +5/+5 until end of turn.",
    },
  ],
});
