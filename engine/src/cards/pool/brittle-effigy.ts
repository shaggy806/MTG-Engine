import { defineCard } from "../define.js";

export default defineCard({
  name: "Brittle Effigy",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{4}, {T}, Exile this artifact: Exile target creature.",
  activated: [
    {
      cost: { mana: "{4}", tap: true, exileSelf: true },
      targets: ["creature"],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: "{4}, {T}, Exile this artifact: Exile target creature.",
    },
  ],
});
