import { defineCard } from "../define.js";

const ENTERS_TEXT = "When this creature enters, you and target opponent each create a Treasure token.";
const SACRIFICE_TEXT = "Whenever an opponent sacrifices a noncreature token, that player gets two poison counters.";

// The two Treasures are made together, by one instruction. An illegal target
// leaves the whole ability doing nothing (the ruling).
export default defineCard({
  name: "Bloodroot Apothecary",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Squirrel", "Druid"],
  power: 3,
  toughness: 3,
  toxic: 2,
  text:
    "Toxic 2 (Players dealt combat damage by this creature also get two poison counters. A player with ten " +
    `or more poison counters loses the game.)\n${ENTERS_TEXT}\n${SACRIFICE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: {
        kind: "sequence",
        simultaneous: true,
        effects: [
          { kind: "create-token", token: "Treasure Token", count: 1 },
          { kind: "create-token", token: "Treasure Token", count: 1, who: "target-controller" },
        ],
      },
      resolve: null,
      text: ENTERS_TEXT,
    },
    {
      trigger: { on: "sacrifice", who: "opponent", filter: { token: true, notTypes: ["creature"] } },
      targets: [],
      effect: { kind: "add-player-counters", counter: "poison", amount: 2, who: "trigger-player" },
      resolve: null,
      text: SACRIFICE_TEXT,
    },
  ],
});
