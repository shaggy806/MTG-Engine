import { defineCard } from "../define.js";

export default defineCard({
  name: "Angelheart Protector",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 3,
  toughness: 2,
  text: "When this creature enters, target creature you control gains indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy it.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature you control gains indestructible until end of turn.",
    },
  ],
});
