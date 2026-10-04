import { defineCard } from "../define.js";

// EDHREC rank 2383.

export default defineCard({
  name: "Steelbane Hydra",
  manaCost: "{X}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Turtle", "Hydra"],
  power: 0,
  toughness: 0,
  text: "This creature enters with X +1/+1 counters on it.\n{2}{G}, Remove a +1/+1 counter from this creature: Destroy target artifact or enchantment.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: "This creature enters with X +1/+1 counters on it.",
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{G}", tap: false, removeCounter: { kind: "+1/+1", count: 1 } },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{2}{G}, Remove a +1/+1 counter from this creature: Destroy target artifact or enchantment.",
    },
  ],
});
