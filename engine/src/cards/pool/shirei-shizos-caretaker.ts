import { defineCard } from "../define.js";

// #355 in top-commanders.txt.
//
// "That card" rides on the delayed trigger as its trigger object; "if Shirei
// is still on the battlefield" is checked as it resolves, of the same
// Shirei (rule 400.7). The "you may" is the delayed ability's.
const TEXT =
  "Whenever a creature with power 1 or less is put into your graveyard from the battlefield, you may " +
  "return that card to the battlefield at the beginning of the next end step if Shirei is still on " +
  "the battlefield.";

export default defineCard({
  name: "Shirei, Shizo's Caretaker",
  manaCost: "{4}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature", ownedBy: "you", power: { op: "lte", n: 1 } } },
      targets: [],
      effect: {
        kind: "delayed-trigger",
        at: "next-end-step",
        effect: {
          kind: "conditional",
          condition: { kind: "source-on-battlefield" },
          then: {
            kind: "may",
            prompt: "Return that card to the battlefield?",
            effect: { kind: "put-onto-battlefield", target: "trigger-object" },
          },
        },
        text: "Return that card to the battlefield if Shirei is still on the battlefield.",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
