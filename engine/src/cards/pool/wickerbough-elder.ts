import { defineCard } from "../define.js";

// EDHREC rank 5146.
//
// Rulings:
//   [2018-12-07] You must choose a target artifact or enchantment to activate Wickerbough Elder's
//     last ability. You can't pay {G} just to remove a -1/-1 counter from it without a legal
//     target.
//   [2018-12-07] If an effect puts Wickerbough Elder onto the battlefield with one or more +1/+1
//     counters, its -1/-1 counter and one of those +1/+1 counters are removed as a state-based
//     action before you can activate its ability.

const ENTER_TEXT = "This creature enters with a -1/-1 counter on it.";
const DESTROY_TEXT = "{G}, Remove a -1/-1 counter from this creature: Destroy target artifact or enchantment.";

export default defineCard({
  name: "Wickerbough Elder",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk", "Shaman"],
  power: 4,
  toughness: 4,
  text: `${ENTER_TEXT}\n${DESTROY_TEXT}`,
  activated: [
    {
      cost: { mana: "{G}", tap: false, removeCounter: { kind: "-1/-1", count: 1 } },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: DESTROY_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "-1/-1", amount: 1 } },
      text: ENTER_TEXT,
    },
  ],
});
