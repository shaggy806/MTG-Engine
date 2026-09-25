import { defineCard } from "../define.js";

export default defineCard({
  name: "Grim Bauble",
  manaCost: "{B}",
  colors: ["B"],
  types: ["artifact"],
  text: "When this artifact enters, target creature an opponent controls gets -2/-2 until end of turn.\n{2}{B}, {T}, Sacrifice this artifact: Surveil 2. (Look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "surveil", amount: 2 },
      resolve: null,
      text: "{2}{B}, {T}, Sacrifice this artifact: Surveil 2.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: -2, duration: "end-of-turn" },
      resolve: null,
      text: "When this artifact enters, target creature an opponent controls gets -2/-2 until end of turn.",
    },
  ],
});
