import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Sonic Screwdriver",
  manaCost: "{3}",
  types: ["artifact"],
  text:
    "{T}: Add one mana of any color.\n" +
    "{1}, {T}: Untap another target artifact.\n" +
    "{2}, {T}: Scry 1.\n" +
    "{3}, {T}: Target creature can't be blocked this turn.",
  activated: [
    addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." }),
    {
      cost: { mana: "{1}", tap: true },
      targets: [{ kind: "other", of: "artifact" }],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{1}, {T}: Untap another target artifact.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "{2}, {T}: Scry 1.",
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: "{3}, {T}: Target creature can't be blocked this turn.",
    },
  ],
});
