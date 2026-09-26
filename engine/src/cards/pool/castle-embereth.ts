import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const PUMP_TEXT = "{1}{R}{R}, {T}: Creatures you control get +1/+0 until end of turn.";

// The creatures pumped are the ones you control as it resolves (rule
// 611.2c); one entering afterwards doesn't get it.
export default defineCard({
  name: "Castle Embereth",
  colors: [],
  types: ["land"],
  text: `This land enters tapped unless you control a Mountain.\n{T}: Add {R}.\n${PUMP_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { subtype: "Mountain" }, atLeast: 1 },
      },
      text: "This land enters tapped unless you control a Mountain.",
    },
  ],
  activated: [
    manaTapAbility("R"),
    {
      cost: { mana: "{1}{R}{R}", tap: true },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
