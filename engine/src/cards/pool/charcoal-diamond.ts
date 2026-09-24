import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Charcoal Diamond",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "This artifact enters tapped.\n{T}: Add {B}.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This artifact enters tapped.",
    },
  ],
  activated: [manaTapAbility("B")],
});
