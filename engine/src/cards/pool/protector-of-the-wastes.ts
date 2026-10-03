import type { TriggerSpec } from "../../abilities.js";
import { defineCard } from "../define.js";

const EXILE_TEXT =
  "When this creature enters or becomes monstrous, exile up to two target artifacts and/or enchantments controlled by different players.";
const MONSTROSITY_TEXT =
  "{4}{W}: Monstrosity 3. (If this creature isn't monstrous, put three +1/+1 counters on it and it becomes monstrous.)";

// One printed ability with two trigger events, each its own trigger here.
// The second target is another object than the first, controlled by someone
// else (`differentController`); the two are exiled as one instruction.
const exiles = (trigger: TriggerSpec) =>
  ({
    trigger,
    targets: [
      { kind: "optional", of: "artifact-or-enchantment" },
      {
        kind: "optional",
        of: { kind: "other", of: "artifact-or-enchantment", than: { slot: 0 }, differentController: true },
      },
    ],
    effect: {
      kind: "sequence",
      simultaneous: true,
      effects: [
        { kind: "exile", target: 0 },
        { kind: "exile", target: 1 },
      ],
    },
    resolve: null,
    text: EXILE_TEXT,
  }) as const;

export default defineCard({
  name: "Protector of the Wastes",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${EXILE_TEXT}\n${MONSTROSITY_TEXT}`,
  activated: [
    {
      cost: { mana: "{4}{W}", tap: false },
      targets: [],
      effect: { kind: "monstrosity", amount: 3 },
      resolve: null,
      text: MONSTROSITY_TEXT,
    },
  ],
  triggered: [
    exiles({ on: "enters-battlefield", who: "self" }),
    exiles({ on: "becomes-monstrous", who: "self" }),
  ],
});
