import { defineCard } from "../define.js";

export default defineCard({
  name: "Mandible Justiciar",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Cleric"],
  power: 2,
  toughness: 1,
  keywords: ["lifelink"],
  text: "Lifelink\nWhenever another artifact you control enters, this creature gets +1/+1 until end of turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "artifact" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever another artifact you control enters, this creature gets +1/+1 until end of turn.",
    },
  ],
});
