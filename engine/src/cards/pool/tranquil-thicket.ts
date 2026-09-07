import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Tranquil Thicket",
  types: ["land"],
  text: "Tranquil Thicket enters the battlefield tapped.\n{T}: Add {G}.",
  activated: [manaTapAbility("G")],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "Tranquil Thicket enters the battlefield tapped.",
    },
  ],
});
