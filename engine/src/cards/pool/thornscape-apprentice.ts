import { defineCard } from "../define.js";

export default defineCard({
  name: "Thornscape Apprentice",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{R}, {T}: Target creature gains first strike until end of turn.\n{W}, {T}: Tap target creature.",
  activated: [
    {
      cost: { mana: "{R}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "first-strike", duration: "end-of-turn" },
      resolve: null,
      text: "{R}, {T}: Target creature gains first strike until end of turn.",
    },
    {
      cost: { mana: "{W}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{W}, {T}: Tap target creature.",
    },
  ],
});
