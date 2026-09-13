import { defineCard } from "../define.js";

/**
 * The EDH-popularity backlog's Tier-1 "double" feature (`double-counters-all`
 * `EffectSpec`): a one-shot mass effect that reads each matching permanent's
 * *own* current count of a counter kind and adds that many again — distinct
 * from the existing *replacement*-based Doubling Season multiplier
 * (`would-add-counter`), which still composes on top of it (routes through
 * the same `addCounter` a targeted `add-counter` uses).
 */
export default defineCard({
  name: "Kalonian Hydra",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Hydra"],
  power: 0,
  toughness: 0,
  keywords: ["trample"],
  text:
    "Trample\n" +
    "This creature enters with four +1/+1 counters on it.\n" +
    "Whenever this creature attacks, double the number of +1/+1 counters on each creature you control.",
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        counters: { kind: "+1/+1", amount: 4 },
      },
      text: "This creature enters with four +1/+1 counters on it.",
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "double-counters-all",
        filter: { type: "creature", controlledBy: "you" },
        counterKind: "+1/+1",
      },
      resolve: null,
      text: "Whenever this creature attacks, double the number of +1/+1 counters on each creature you control.",
    },
  ],
});
