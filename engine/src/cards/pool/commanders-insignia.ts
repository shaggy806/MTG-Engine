import { defineCard } from "../define.js";

export default defineCard({
  name: "Commander's Insignia",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text:
    "Creatures you control get +1/+1 for each time you've cast your commander " +
    "from the command zone this game.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      // Summed across every commander you have, so a Partner pair counts
      // both — "your commander" covers each of them (rule 903.3).
      grantPtPerCount: { commanderCasts: true, pt: [1, 1] },
      text:
        "Creatures you control get +1/+1 for each time you've cast your commander " +
        "from the command zone this game.",
    },
  ],
});
