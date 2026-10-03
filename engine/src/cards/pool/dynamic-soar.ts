import { defineCard } from "../define.js";

// The Omen of Whirlwing Stormbrood (rule 720).
export default defineCard({
  name: "Dynamic Soar",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Omen"],
  text: "Put three +1/+1 counters on target creature you control. (Then shuffle this card into its owner's library.)",
  targets: ["creature-you-control"],
  effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 3 },
  faces: ["Whirlwing Stormbrood", "Dynamic Soar"],
  omen: true,
});
