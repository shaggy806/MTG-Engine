import { defineCard } from "../define.js";

export default defineCard({
  name: "Soaring Seacliff",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\nWhen this land enters, target creature gains flying until end of turn.\n{T}: Add {U}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "When this land enters, target creature gains flying until end of turn.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
