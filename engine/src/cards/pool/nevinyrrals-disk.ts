import { defineCard } from "../define.js";

const TEXT = "{1}, {T}: Destroy all artifacts, creatures, and enchantments.";

// It destroys itself too: it's an artifact.
export default defineCard({
  name: "Nevinyrral's Disk",
  manaCost: "{4}",
  types: ["artifact"],
  text: `This artifact enters tapped.\n${TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This artifact enters tapped.",
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "destroy-all", filter: { typesAnyOf: ["artifact", "creature", "enchantment"] } },
      resolve: null,
      text: TEXT,
    },
  ],
});
