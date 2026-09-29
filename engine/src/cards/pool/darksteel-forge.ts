import { defineCard } from "../define.js";

const TEXT = "Artifacts you control have indestructible.";

export default defineCard({
  name: "Darksteel Forge",
  manaCost: "{9}",
  colors: [],
  types: ["artifact"],
  text: `${TEXT} (Effects that say "destroy" don't destroy them. Artifact creatures with indestructible can't be destroyed by damage.)`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "artifact", controlledBy: "you" } },
      grantKeywords: ["indestructible"],
      text: TEXT,
    },
  ],
});
