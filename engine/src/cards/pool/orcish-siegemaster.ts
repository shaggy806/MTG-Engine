import { defineCard } from "../define.js";

// EDHREC rank 4343.

const TRAMPLE_TEXT = "Other Orcs and Goblins you control have trample.";
const ATTACK_TEXT =
  "Whenever this creature attacks, it gets +X/+0 until end of turn, where X is the greatest power among creatures you control.";

export default defineCard({
  name: "Orcish Siegemaster",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Orc", "Soldier"],
  power: 0,
  toughness: 5,
  keywords: ["trample"],
  text: `Trample\n${TRAMPLE_TEXT}\n${ATTACK_TEXT}`,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", subtypes: ["Orc", "Goblin"], controlledBy: "you" },
        excludeSelf: true,
      },
      grantKeywords: ["trample"],
      text: TRAMPLE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      // X is read as the ability resolves, counting this creature too.
      effect: {
        kind: "modify-pt",
        target: "source",
        power: { aggregate: "max", of: "power", filter: { type: "creature", controlledBy: "you" } },
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
