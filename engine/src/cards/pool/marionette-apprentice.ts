import { defineCard } from "../define.js";

// Fabricate 1 (rule 702.123) is an enters trigger whose choice is made as it
// resolves: a +1/+1 counter on this creature, or a 1/1 Servo.
export default defineCard({
  name: "Marionette Apprentice",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 1,
  toughness: 2,
  text:
    "Fabricate 1 (When this creature enters, put a +1/+1 counter on it or create a 1/1 colorless Servo artifact creature token.)\n" +
    "Whenever another creature or artifact you control is put into a graveyard from the battlefield, each opponent loses 1 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: "Put a +1/+1 counter on this creature.",
            effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          },
          {
            text: "Create a 1/1 colorless Servo artifact creature token.",
            effect: { kind: "create-token", token: "Servo Token", count: 1 },
          },
        ],
      },
      resolve: null,
      text:
        "Fabricate 1 (When this creature enters, put a +1/+1 counter on it or create a 1/1 colorless Servo artifact creature token.)",
    },
    {
      trigger: {
        on: "dies",
        who: "you-control",
        filter: { typesAnyOf: ["creature", "artifact"] },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text:
        "Whenever another creature or artifact you control is put into a graveyard from the battlefield, each opponent loses 1 life.",
    },
  ],
});
