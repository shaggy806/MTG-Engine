import { defineCard } from "../define.js";

const END_TEXT =
  "At the beginning of each end step, if you gained 5 or more life this turn, create a 4/4 white Angel creature token with flying and vigilance.";
const PUMP_TEXT = "{3}{W}{W}{W}: Until end of turn, this creature gets +2/+2 and gains lifelink.";

export default defineCard({
  name: "Resplendent Angel",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${END_TEXT}\n${PUMP_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 5 },
      targets: [],
      effect: { kind: "create-token", token: "4/4 Vigilant Angel Token", count: 1 },
      resolve: null,
      text: END_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{W}{W}{W}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
          { kind: "grant-keyword", target: "source", keyword: "lifelink", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
