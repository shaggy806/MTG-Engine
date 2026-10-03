import type { TriggerSpec } from "../../abilities.js";
import { defineCard } from "../define.js";

const DAMAGE_TEXT =
  "Whenever this creature attacks, blocks, or becomes the target of a spell, it deals damage equal to its power to each opponent.";
const MONSTROSITY_TEXT =
  "{5}: Monstrosity 5. (If this creature isn't monstrous, put five +1/+1 counters on it and it becomes monstrous.)";

// One printed ability with three trigger events: each is its own trigger
// here, with the same effect. "Its power" is read as the ability resolves —
// as it last existed on the battlefield, if it has left.
const pings = (trigger: TriggerSpec) => ({
  trigger,
  targets: [],
  effect: { kind: "damage", who: "each-opponent", amount: { powerOf: "source" } },
  resolve: null,
  text: DAMAGE_TEXT,
} as const);

export default defineCard({
  name: "Giggling Skitterspike",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Toy"],
  power: 1,
  toughness: 1,
  keywords: ["indestructible"],
  text: `Indestructible\n${DAMAGE_TEXT}\n${MONSTROSITY_TEXT}`,
  activated: [
    {
      cost: { mana: "{5}", tap: false },
      targets: [],
      effect: { kind: "monstrosity", amount: 5 },
      resolve: null,
      text: MONSTROSITY_TEXT,
    },
  ],
  triggered: [
    pings({ on: "attacks", who: "self" }),
    pings({ on: "blocks", who: "self" }),
    pings({ on: "becomes-target", who: "self", spellOnly: true }),
  ],
});
