import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/** ROADMAP Phase 10a — the land back face of Grovewatch Elder. */
export default defineCard({
  name: "Grovewatch Hollow",
  types: ["land"],
  text: "Grovewatch Hollow enters the battlefield tapped.\n{T}: Add {G}.",
  activated: [manaTapAbility("G")],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "Grovewatch Hollow enters the battlefield tapped.",
    },
  ],
  faces: ["Grovewatch Elder", "Grovewatch Hollow"],
});
