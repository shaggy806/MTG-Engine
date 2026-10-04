import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

// EDHREC rank 2397. No mana cost, so it can only be suspended (rule 118.6),
// like Ancestral Vision; the free cast as the last time counter comes off
// resolves it onto the battlefield as an ordinary artifact.
export default defineCard({
  name: "Sol Talisman",
  colors: [],
  types: ["artifact"],
  text:
    "Suspend 3—{1} (Rather than cast this card from your hand, pay {1} and exile it with three time counters on it. At the beginning of your upkeep, remove a time counter. When the last is removed, you may cast it without paying its mana cost.)\n" +
    "{T}: Add {C}{C}.",
  suspend: { n: 3, cost: "{1}" },
  activated: [addManaAbility({ mana: "C", amount: 2, text: "{T}: Add {C}{C}." })],
});
