import { defineCard } from "../define.js";

const TEXT = "Whenever an opponent casts a noncreature spell, that player loses 2 life and you gain 2 life.";

// An artifact creature spell isn't a noncreature spell (the ruling).
export default defineCard({
  name: "Kambal, Consul of Allocation",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Advisor"],
  power: 2,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", filter: { notTypes: ["creature"] } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", who: "trigger-controller", amount: 2 },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
