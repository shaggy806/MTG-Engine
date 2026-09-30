import { defineCard } from "../define.js";

const TEXT =
  "When this creature dies, create a 3/3 colorless Golem artifact creature token with flying, a 3/3 colorless Golem artifact creature token with vigilance, and a 3/3 colorless Golem artifact creature token with trample.";

export default defineCard({
  name: "Triplicate Titan",
  manaCost: "{9}",
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 9,
  toughness: 9,
  keywords: ["flying", "vigilance", "trample"],
  text: `Flying, vigilance, trample\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Golem Flying Token", count: 1 },
          { kind: "create-token", token: "Golem Vigilance Token", count: 1 },
          { kind: "create-token", token: "Golem Trample Token", count: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
