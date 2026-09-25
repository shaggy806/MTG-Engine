import { defineCard } from "../define.js";

export default defineCard({
  name: "Mardu Devotee",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Scout"],
  power: 1,
  toughness: 2,
  text: "When this creature enters, scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)\n{1}: Add {R}, {W}, or {B}. Activate only once each turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "W", "B"] }, amount: 1 },
      resolve: null,
      text: "{1}: Add {R}, {W}, or {B}. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "When this creature enters, scry 2.",
    },
  ],
});
