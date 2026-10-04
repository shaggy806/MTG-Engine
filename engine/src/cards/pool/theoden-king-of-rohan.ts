import { defineCard } from "../define.js";

// EDHREC rank 4606.

export default defineCard({
  name: "Théoden, King of Rohan",
  manaCost: "{1}{R}{W}",
  colors: ["W", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble"],
  power: 2,
  toughness: 3,
  text: "Whenever Théoden or another Human you control enters, target creature gains double strike until end of turn.",
  triggered: [
    // Two triggers, so Théoden sees his own entry whatever his subtypes then
    // (a copy that isn't a Human still triggers for "Théoden").
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
      resolve: null,
      text: "Whenever Théoden or another Human you control enters, target creature gains double strike until end of turn.",
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature", subtype: "Human" }, otherOnly: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
      resolve: null,
      text: "Whenever Théoden or another Human you control enters, target creature gains double strike until end of turn.",
    },
  ],
});
