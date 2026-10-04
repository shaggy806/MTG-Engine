import { defineCard } from "../define.js";

// EDHREC rank 5062.

// "If it's a Spider" is asked as the ability resolves, of the creature that
// entered (the trigger object); a changeling is a Spider.
const TEXT = "Whenever another creature you control enters, you gain 1 life. If it's a Spider, put a +1/+1 counter on it.";

export default defineCard({
  name: "Aunt May",
  manaCost: "{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Citizen"],
  power: 0,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "trigger-object", filter: { subtype: "Spider" } },
            then: { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
