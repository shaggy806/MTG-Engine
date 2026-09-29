import { defineCard } from "../define.js";

const UPKEEP_TEXT =
  "At the beginning of your upkeep, exile the top two cards of your library. You may play them " +
  "this turn. If you exiled a land card this way, create a 3/1 red Dinosaur creature token. If " +
  "you exiled a nonland card this way, create a Treasure token.";

// Both checks read the two cards the exile just took (`this-way`), so two
// lands make one Dinosaur and no Treasure.
export default defineCard({
  name: "Bonehoard Dracosaur",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dinosaur", "Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "first-strike"],
  text: `Flying, first strike\n${UPKEEP_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "impulse-exile", amount: 2, duration: "end-of-turn" },
          {
            kind: "conditional",
            condition: { kind: "this-way", what: "exiled", filter: { type: "land" } },
            then: { kind: "create-token", token: "3/1 Dinosaur Token", count: 1 },
          },
          {
            kind: "conditional",
            condition: { kind: "this-way", what: "exiled", filter: { notTypes: ["land"] } },
            then: { kind: "create-token", token: "Treasure Token", count: 1 },
          },
        ],
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
