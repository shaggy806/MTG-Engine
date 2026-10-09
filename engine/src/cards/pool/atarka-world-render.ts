import { defineCard } from "../define.js";

export default defineCard({
  name: "Atarka, World Render",
  manaCost: "{5}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 6,
  toughness: 4,
  keywords: ["flying", "trample"],
  text: "Flying, trample\nWhenever a Dragon you control attacks, it gains double strike until end of turn.",
  triggered: [
    {
      // needed-cards P11 — the "attacks" TriggerSpec's new `filter` narrows
      // this to a Dragon; the keyword is granted to the *attacking* creature
      // (the trigger object), not necessarily Atarka itself.
      trigger: { on: "attacks", who: "you-control", filter: { subtype: "Dragon" } },
      targets: [],
      effect: { kind: "grant-keyword", target: "trigger-object", keyword: "double-strike", duration: "end-of-turn" },
      resolve: null,
      text: "Whenever a Dragon you control attacks, it gains double strike until end of turn.",
    },
  ],
});
