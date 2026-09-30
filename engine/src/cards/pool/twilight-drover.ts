import { defineCard } from "../define.js";

const LEAVE_TEXT = "Whenever a creature token leaves the battlefield, put a +1/+1 counter on this creature.";
const MAKE_TEXT = "{2}{W}, Remove a +1/+1 counter from this creature: Create two 1/1 white Spirit creature tokens with flying.";

export default defineCard({
  name: "Twilight Drover",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text: `${LEAVE_TEXT}\n${MAKE_TEXT}`,
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "any", filter: { type: "creature", token: true } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{W}", tap: false, removeCounter: { kind: "+1/+1", count: 1 } },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 2 },
      resolve: null,
      text: MAKE_TEXT,
    },
  ],
});
