import { defineCard } from "../define.js";

/**
 * The EDH-popularity backlog's Tier-1 Convoke feature (rule 702.51):
 * `CardDefinition.convoke` — a pure payment-method choice made as the spell
 * is cast (`Action.convoke`), tapping untapped creatures instead of paying
 * mana for part of the cost. Doesn't change the printed cost, targets, or
 * effect at all.
 */
export default defineCard({
  name: "Hour of Reckoning",
  manaCost: "{4}{W}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text:
    "Convoke (Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color.)\n" +
    "Destroy all nontoken creatures.",
  convoke: true,
  effect: { kind: "destroy-all", filter: { type: "creature", token: false } },
});
