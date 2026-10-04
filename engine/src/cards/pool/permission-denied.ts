import { defineCard } from "../define.js";

// EDHREC rank 4322.
//
// Rulings:
//   [2023-11-10] If Permission Denied resolves but the spell isn't countered (perhaps because it
//     can't be countered), opponents will still be unable to cast noncreature spells this turn.
//   [2023-11-10] Permission Denied's effect applies to all opponents, not just the player who
//     controlled the spell targeted by Permission Denied.
//   [2023-11-10] If the spell is an illegal target as Permission Denied tries to resolve, it won't
//     resolve and none of its effects will happen.

export default defineCard({
  name: "Permission Denied",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["instant"],
  text: "Counter target noncreature spell. Your opponents can't cast noncreature spells this turn.",
  targets: ["noncreature-spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      // Ranger-Captain of Eos's lock.
      {
        kind: "prohibit",
        who: "each-opponent",
        spells: { filter: { notTypes: ["creature"] }, label: "noncreature spells" },
      },
    ],
  },
});
