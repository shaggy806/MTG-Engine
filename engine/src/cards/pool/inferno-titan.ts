import type { TriggerSpec } from "../../abilities.js";
import { defineCard } from "../define.js";

const PUMP_TEXT = "{R}: This creature gets +1/+0 until end of turn.";
const DAMAGE_TEXT =
  "Whenever this creature enters or attacks, it deals 3 damage divided as you choose among one, two, or three targets.";

// One printed ability with two trigger events, each its own trigger here.
// The split is chosen as the trigger goes on the stack, at least 1 each.
const burns = (trigger: TriggerSpec) =>
  ({
    trigger,
    targets: [{ kind: "any-number", of: "any-target", min: 1, max: 3 }],
    divided: { total: 3, slot: 0 },
    effect: { kind: "damage-divided", from: 0 },
    resolve: null,
    text: DAMAGE_TEXT,
  }) as const;

export default defineCard({
  name: "Inferno Titan",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 6,
  toughness: 6,
  text: `${PUMP_TEXT}\n${DAMAGE_TEXT}`,
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
  triggered: [burns({ on: "enters-battlefield", who: "self" }), burns({ on: "attacks", who: "self" })],
});
