import { defineCard } from "../define.js";

export default defineCard({
  name: "Krosan Grip",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Split second (As long as this spell is on the stack, players can't cast spells or activate abilities that aren't mana abilities.)\n" +
    "Destroy target artifact or enchantment.",
  splitSecond: true,
  targets: ["artifact-or-enchantment"],
  effect: { kind: "destroy", target: 0 },
});
