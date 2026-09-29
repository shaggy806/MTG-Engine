import { defineCard } from "../define.js";

const ENTER_TEXT = "When this artifact enters, put a -1/-1 counter on target creature.";
const PROLIFERATE_TEXT = "{4}, {T}: Proliferate.";

export default defineCard({
  name: "Contagion Clasp",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text:
    `${ENTER_TEXT}\n${PROLIFERATE_TEXT} (Choose any number of permanents and/or players, then give ` +
    "each another counter of each kind already there.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "-1/-1", amount: 1 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}", tap: true },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: PROLIFERATE_TEXT,
    },
  ],
});
