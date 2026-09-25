import { defineCard } from "../define.js";

export default defineCard({
  name: "Sunhome, Fortress of the Legion",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{2}{R}{W}, {T}: Target creature gains double strike until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}{R}{W}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
      resolve: null,
      text: "{2}{R}{W}, {T}: Target creature gains double strike until end of turn.",
    },
  ],
});
