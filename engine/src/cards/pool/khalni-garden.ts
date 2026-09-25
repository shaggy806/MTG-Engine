import { defineCard } from "../define.js";

export default defineCard({
  name: "Khalni Garden",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\nWhen this land enters, create a 0/1 green Plant creature token.\n{T}: Add {G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Plant Token", count: 1 },
      resolve: null,
      text: "When this land enters, create a 0/1 green Plant creature token.",
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
