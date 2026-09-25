import { defineCard } from "../define.js";

export default defineCard({
  name: "Withstand Death",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature gains indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy it. If its toughness is 0 or less, it still dies.)",
  targets: ["creature"],
  effect: { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
});
