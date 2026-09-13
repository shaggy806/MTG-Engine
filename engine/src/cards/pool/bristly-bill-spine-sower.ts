import { defineCard } from "../define.js";

/** `double-counters-all` — see Kalonian Hydra for the mechanism. */
export default defineCard({
  name: "Bristly Bill, Spine Sower",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Plant", "Druid"],
  power: 2,
  toughness: 2,
  text:
    "Landfall — Whenever a land you control enters, put a +1/+1 counter on target creature.\n" +
    "{3}{G}{G}: Double the number of +1/+1 counters on each creature you control.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, put a +1/+1 counter on target creature.",
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{G}{G}", tap: false },
      targets: [],
      effect: {
        kind: "double-counters-all",
        filter: { type: "creature", controlledBy: "you" },
        counterKind: "+1/+1",
      },
      resolve: null,
      text: "{3}{G}{G}: Double the number of +1/+1 counters on each creature you control.",
    },
  ],
});
