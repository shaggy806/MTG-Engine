import { defineCard } from "../define.js";

export default defineCard({
  name: "River Sneak",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Warrior"],
  power: 1,
  toughness: 1,
  text: "This creature can't be blocked.\nWhenever another Merfolk you control enters, this creature gets +1/+1 until end of turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Merfolk" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever another Merfolk you control enters, this creature gets +1/+1 until end of turn.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      grantKeywords: ["unblockable"],
      text: "This creature can't be blocked.",
    },
  ],
});
