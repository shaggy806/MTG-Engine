import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 2884.
//
// Rulings:
//   [2023-02-04] An ability that triggers "Whenever you proliferate" triggers even if you chose no
//     permanents or players while doing so.
//   [2023-02-04] You don't have to choose every permanent or player that has a counter, only the
//     ones you want to add another counter to.

const CORRUPTED_TEXT =
  "Corrupted — {T}: Add three mana of any one color. Activate only if an opponent has three or more poison counters.";

export default defineCard({
  name: "Glistening Sphere",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: `This artifact enters tapped.\nWhen this artifact enters, proliferate.\n{T}: Add one mana of any color.\n${CORRUPTED_TEXT}`,
  activated: [
    addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." }),
    {
      ...addManaAbility({ mana: "any-color", amount: 3, text: CORRUPTED_TEXT }),
      condition: { kind: "player-counters", counter: "poison", who: "opponent", atLeast: 3 },
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "When this artifact enters, proliferate.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This artifact enters tapped.",
    },
  ],
});
