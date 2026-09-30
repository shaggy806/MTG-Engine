import { defineCard } from "../define.js";

// Together, as one event; an Aura returned this way is attached to
// something it can enchant as it enters, or stays put (rule 303.4f).
export default defineCard({
  name: "Brilliant Restoration",
  manaCost: "{3}{W}{W}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Return all artifact and enchantment cards from your graveyard to the battlefield.",
  effect: {
    kind: "return-from-graveyard",
    filter: { typesAnyOf: ["artifact", "enchantment"] },
    destination: "battlefield",
    count: "all",
  },
});
