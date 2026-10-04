import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 4382.
// No mana cost: cast only by suspending it (or for an alternative cost) —
// Lotus Bloom's shape.

export default defineCard({
  name: "Mox Tantalite",
  colors: [],
  types: ["artifact"],
  text: "Suspend 3—{0} (Rather than cast this card from your hand, pay {0} and exile it with three time counters on it. At the beginning of your upkeep, remove a time counter. When the last is removed, you may cast it without paying its mana cost.)\n{T}: Add one mana of any color.",
  suspend: { n: 3, cost: "{0}" },
  activated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
});
