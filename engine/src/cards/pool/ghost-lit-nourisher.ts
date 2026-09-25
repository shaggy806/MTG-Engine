import { defineCard } from "../define.js";

export default defineCard({
  name: "Ghost-Lit Nourisher",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 1,
  text: "{2}{G}, {T}: Target creature gets +2/+2 until end of turn.\nChannel — {3}{G}, Discard this card: Target creature gets +4/+4 until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{G}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{2}{G}, {T}: Target creature gets +2/+2 until end of turn.",
    },
    {
      cost: { mana: "{3}{G}", tap: false },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 4, toughness: 4, duration: "end-of-turn" },
      resolve: null,
      text: "Channel — {3}{G}, Discard this card: Target creature gets +4/+4 until end of turn.",
      zone: "hand",
    },
  ],
});
