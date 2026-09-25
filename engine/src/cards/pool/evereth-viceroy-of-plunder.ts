import { defineCard } from "../define.js";

// #387 in top-commanders.txt.
//
// "If the sacrificed permanent was a Treasure" reads it as it last existed;
// the death trigger's damage reads Evereth's power as she died.
const SAC_TEXT =
  "Sacrifice another creature or artifact: Put a +1/+1 counter on Evereth. If the sacrificed permanent " +
  "was a Treasure, Evereth gains lifelink until end of turn. Activate only as a sorcery.";
const DIES_TEXT =
  "When Evereth dies, you may pay {1}{B/R}. When you do, Evereth deals damage equal to its power to each opponent.";

export default defineCard({
  name: "Evereth, Viceroy of Plunder",
  manaCost: "{2}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Soldier"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${SAC_TEXT}\n${DIES_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { typesAnyOf: ["creature", "artifact"] } } },
      otherOnly: true,
      sorcerySpeed: true,
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "sacrificed", filter: { subtype: "Treasure" } },
            then: { kind: "grant-keyword", target: "source", keyword: "lifelink", duration: "end-of-turn" },
          },
        ],
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1}{B/R} to have Evereth deal damage equal to its power to each opponent?",
        cost: "{1}{B/R}",
        effect: {
          kind: "reflexive-trigger",
          targets: [],
          effect: { kind: "damage", amount: { powerOf: "source" }, who: "each-opponent" },
          text: "When you do, Evereth deals damage equal to its power to each opponent.",
        },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
