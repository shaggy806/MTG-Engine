import type { TriggeredAbility } from "../../abilities.js";
import type { TargetSpec } from "../../target.js";
import { EVERY_CREATURE_TYPE, EVERY_LAND_TYPE } from "../../subtypes.js";
import { defineCard } from "../define.js";

// #174 in top-commanders.txt.
//
// A land that is every land type is every basic land type, so it taps for
// every colour (rule 305.6), and every other land type besides (its ruling).
// The two targets are separate instances of "target", so a land creature
// could be chosen for both — which would still put one counter on it, so the
// creature slot is simply another object than the land.
const TRIGGER_TEXT =
  "Whenever Omo enters or attacks, put an everything counter on each of up to one target land and up to one " +
  "target creature.";
const LAND_TEXT = "Each land with an everything counter on it is every land type in addition to its other types.";
const CREATURE_TEXT = "Each nonland creature with an everything counter on it is every creature type.";

const TARGETS: readonly TargetSpec[] = [
  { kind: "optional", of: "land" },
  { kind: "optional", of: { kind: "other", of: "creature", than: { slot: 0 } } },
];
const COUNTERS = {
  kind: "sequence",
  effects: [
    { kind: "add-counter", target: 0, counter: "everything", amount: 1 },
    { kind: "add-counter", target: 1, counter: "everything", amount: 1 },
  ],
} as const;
const trigger = (on: "enters-battlefield" | "attacks"): TriggeredAbility => ({
  trigger: { on, who: "self" },
  targets: TARGETS,
  effect: COUNTERS,
  resolve: null,
  text: TRIGGER_TEXT,
});
const EVERYTHING = { kind: "everything", compare: { op: "gte", n: 1 } } as const;

export default defineCard({
  name: "Omo, Queen of Vesuva",
  manaCost: "{2}{G/U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Shapeshifter", "Noble"],
  power: 1,
  toughness: 5,
  text: `${TRIGGER_TEXT}\n${LAND_TEXT}\n${CREATURE_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "land", counters: EVERYTHING } },
      addSubtypes: [EVERY_LAND_TYPE],
      text: LAND_TEXT,
    },
    {
      affects: { scope: "filter", filter: { type: "creature", notTypes: ["land"], counters: EVERYTHING } },
      addSubtypes: [EVERY_CREATURE_TYPE],
      text: CREATURE_TEXT,
    },
  ],
  triggered: [trigger("enters-battlefield"), trigger("attacks")],
});
