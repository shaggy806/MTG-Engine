import { defineCard } from "../define.js";

// EDHREC rank 3471.

export default defineCard({
  name: "Auriok Champion",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text: "Protection from black and from red\nWhenever another creature enters, you may gain 1 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "may", prompt: "Gain 1 life?", effect: { kind: "gain-life", amount: 1 } },
      resolve: null,
      text: "Whenever another creature enters, you may gain 1 life.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      protection: { colors: ["B", "R"] },
      text: "Protection from black and from red",
    },
  ],
});
