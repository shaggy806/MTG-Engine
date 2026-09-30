import { defineCard } from "../define.js";

const COUNTER_TEXT = "Whenever a creature is exiled from the battlefield, put a +1/+1 counter on this creature.";
const BLINK_TEXT =
  "At the beginning of your end step, you may exile another target creature you control, then return that card to the battlefield under its owner's control.";

// Its own blink of another creature grows it: that creature was exiled
// from the battlefield (a token's too, though it doesn't come back).
export default defineCard({
  name: "Soulherder",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text: `${COUNTER_TEXT}\n${BLINK_TEXT}`,
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "any", filter: { type: "creature" }, to: ["exile"] },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: COUNTER_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [{ kind: "other", of: "creature-you-control" }],
      effect: {
        kind: "may",
        prompt: "Exile that creature and return it?",
        effect: { kind: "flicker", target: 0 },
      },
      resolve: null,
      text: BLINK_TEXT,
    },
  ],
});
