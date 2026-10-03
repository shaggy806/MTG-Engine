import { defineCard } from "../define.js";

// The cards' powers are read as they are in the graveyard (the ruling), as
// they're chosen and again as the spell resolves: a total gone over 10 by
// then makes every target illegal, and nothing returns. Any number of 0-power
// cards fit beside the rest. They return together, one instruction.
export default defineCard({
  name: "Reunion of the House",
  manaCost: "{5}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text:
    "Return any number of target creature cards with total power 10 or less from your graveyard to the battlefield. Exile Reunion of the House.",
  exileOnResolve: true,
  targets: [
    {
      kind: "any-number",
      of: { kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } },
      maxTotalPower: 10,
    },
  ],
  effect: {
    kind: "for-each-target",
    from: 0,
    simultaneous: true,
    effect: { kind: "put-onto-battlefield", target: 0 },
  },
});
