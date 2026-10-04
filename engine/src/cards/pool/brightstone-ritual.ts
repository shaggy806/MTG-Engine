import { defineCard } from "../define.js";

// EDHREC rank 2514. Every player's Goblins count (Battle Hymn's shape, with
// no `controlledBy`).

export default defineCard({
  name: "Brightstone Ritual",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Add {R} for each Goblin on the battlefield.",
  effect: { kind: "add-mana", mana: "R", amount: { countOf: { subtype: "Goblin" } } },
});
