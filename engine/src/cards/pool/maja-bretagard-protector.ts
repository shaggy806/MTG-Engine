import { defineCard } from "../define.js";

export default defineCard({
  name: "Maja, Bretagard Protector",
  manaCost: "{2}{G}{W}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 3,
  text:
    "Other creatures you control get +1/+1.\n" +
    "Landfall — Whenever a land you control enters, create a 1/1 white Human " +
    "Warrior creature token.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantPt: [1, 1],
      text: "Other creatures you control get +1/+1.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you",
        filter: { type: "land", controlledBy: "you" },
      },
      targets: [],
      effect: { kind: "create-token", token: "Human Warrior Token", count: 1 },
      resolve: null,
      text:
        "Landfall — Whenever a land you control enters, create a 1/1 white Human " +
        "Warrior creature token.",
    },
  ],
});
