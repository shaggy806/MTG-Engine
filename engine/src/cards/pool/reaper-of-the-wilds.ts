import { defineCard } from "../define.js";

export default defineCard({
  name: "Reaper of the Wilds",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Gorgon"],
  power: 4,
  toughness: 5,
  text: "Whenever another creature dies, scry 1.\n{B}: This creature gains deathtouch until end of turn.\n{1}{G}: This creature gains hexproof until end of turn.",
  activated: [
    {
      cost: { mana: "{B}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "deathtouch",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{B}: This creature gains deathtouch until end of turn.",
    },
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "hexproof", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{G}: This creature gains hexproof until end of turn.",
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "Whenever another creature dies, scry 1.",
    },
  ],
});
