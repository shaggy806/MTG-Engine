import { defineCard } from "../define.js";

export default defineCard({
  name: "Loxodon Sergeant",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elephant", "Soldier"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance\nWhen this creature enters, other creatures you control gain vigilance until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "vigilance",
        duration: "end-of-turn",
        exceptSource: true,
      },
      resolve: null,
      text: "When this creature enters, other creatures you control gain vigilance until end of turn.",
    },
  ],
});
