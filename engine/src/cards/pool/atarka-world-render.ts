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
      // (ctx.triggerObject), not necessarily Atarka itself.
      trigger: { on: "attacks", who: "you-control", filter: { subtype: "Dragon" } },
      targets: [],
      effect: null,
      resolve: (ctx) => {
        if (ctx.triggerObject !== undefined) {
          ctx.grantKeyword({ kind: "object", object: ctx.triggerObject }, "double-strike", "end-of-turn");
        }
      },
      text: "Whenever a Dragon you control attacks, it gains double strike until end of turn.",
    },
  ],
});
