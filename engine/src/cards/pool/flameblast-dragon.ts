import { defineCard } from "../define.js";

export default defineCard({
  name: "Flameblast Dragon",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever this creature attacks, you may pay {X}{R}. If you do, it deals X damage to any target.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      // The target belongs to the *ability*, chosen as the trigger goes on the
      // stack — the `may` doesn't introduce one of its own, which is the rule
      // that keeps `may` / `modal` non-targeted.
      targets: ["any-target"],
      effect: {
        kind: "may",
        prompt: "Pay {X}{R} to deal X damage?",
        cost: "{X}{R}",
        // `"x"` reads the X paid for the choice itself.
        effect: { kind: "damage", amount: "x", target: 0 },
      },
      resolve: null,
      text: "Whenever this creature attacks, you may pay {X}{R}. If you do, it deals X damage to any target.",
    },
  ],
});
