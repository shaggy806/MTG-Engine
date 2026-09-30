import { defineCard } from "../define.js";

const ENTER_TEXT = "When this creature enters, create two 1/1 colorless Thopter artifact creature tokens with flying.";
const TAP_TEXT = "Tap two untapped artifacts you control: Target creature can't be blocked this turn.";

// The artifacts tapped for the cost may be summoning sick: it's not their
// own {T} ability (rule 302.6).
export default defineCard({
  name: "Whirler Rogue",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Rogue", "Artificer"],
  power: 2,
  toughness: 2,
  text: `${ENTER_TEXT}\n${TAP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 2 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, tapOthers: { count: 2, filter: { type: "artifact", controlledBy: "you" } } },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: TAP_TEXT,
    },
  ],
});
