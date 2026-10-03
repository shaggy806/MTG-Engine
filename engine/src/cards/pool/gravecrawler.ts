import { defineCard } from "../define.js";

const CAST_TEXT = "You may cast this card from your graveyard as long as you control a Zombie.";

// Cast from the graveyard for its normal cost, at sorcery speed as ever
// (the ruling: the ability doesn't change when you could cast it), whenever
// you control a Zombie as you cast it — losing it afterwards changes nothing.
export default defineCard({
  name: "Gravecrawler",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 1,
  text: `This creature can't block.\n${CAST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "This creature can't block.",
    },
  ],
  castFromGraveyardIf: { kind: "controls", filter: { subtype: "Zombie" }, atLeast: 1 },
});
