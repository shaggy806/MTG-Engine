import { defineCard } from "../define.js";

const ENTER_TEXT = "This creature enters with a +1/+1 counter on it.";
const LANDFALL_TEXT = "Landfall — Whenever a land you control enters, double the number of +1/+1 counters on this creature.";

// Doubling puts on as many +1/+1 counters as it has (the ruling), so a
// counter doubler applies on top — `double-counters` routes through the same
// placement. Only +1/+1 counters: any other kind it has stays as it is.
export default defineCard({
  name: "Mossborn Hydra",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental", "Hydra"],
  power: 0,
  toughness: 0,
  keywords: ["trample"],
  text: `Trample\n${ENTER_TEXT}\n${LANDFALL_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: 1 } },
      text: ENTER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "double-counters", target: "source", counter: "+1/+1" },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
