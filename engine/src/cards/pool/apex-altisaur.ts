import { defineCard } from "../define.js";

const ENTER_TEXT = "When this creature enters, it fights up to one target creature you don't control.";
const ENRAGE_TEXT = "Enrage — Whenever this creature is dealt damage, it fights up to one target creature you don't control.";

export default defineCard({
  name: "Apex Altisaur",
  manaCost: "{7}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 10,
  toughness: 10,
  text: `${ENTER_TEXT}\n${ENRAGE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "optional", of: "creature-an-opponent-controls" }],
      effect: { kind: "fight", a: "source", b: 0 },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: [{ kind: "optional", of: "creature-an-opponent-controls" }],
      effect: { kind: "fight", a: "source", b: 0 },
      resolve: null,
      text: ENRAGE_TEXT,
    },
  ],
});
