import { defineCard } from "../define.js";

export default defineCard({
  name: "Walking Ballista",
  manaCost: "{X}{X}",
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 0,
  toughness: 0,
  text: "Walking Ballista enters the battlefield with X +1/+1 counters on it.\n{4}: Put a +1/+1 counter on Walking Ballista.",
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        counters: { kind: "+1/+1", amount: "x" },
      },
      text: "Walking Ballista enters the battlefield with X +1/+1 counters on it.",
    },
  ],
  activated: [
    {
      cost: { mana: "{4}", tap: false },
      targets: [],
      effect: {
        kind: "add-counter",
        target: "source",
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: "{4}: Put a +1/+1 counter on Walking Ballista.",
    },
  ],
});
