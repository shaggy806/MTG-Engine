import { defineCard } from "../define.js";

export default defineCard({
  name: "Cogwork Wrestler",
  manaCost: "{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Gnome"],
  power: 1,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash\nWhen this creature enters, target creature an opponent controls gets -2/-0 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature an opponent controls gets -2/-0 until end of turn.",
    },
  ],
});
