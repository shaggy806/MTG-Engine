import { defineCard } from "../define.js";

const TEXT =
  "Constellation — Whenever this creature or another enchantment you control enters, creatures your opponents control get -1/-1 until end of turn.";

const SHRINK = {
  kind: "modify-pt-all",
  filter: { type: "creature", controlledBy: "opponent" },
  power: -1,
  toughness: -1,
  duration: "end-of-turn",
} as const;

export default defineCard({
  name: "Doomwake Giant",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["enchantment", "creature"],
  subtypes: ["Giant"],
  power: 4,
  toughness: 6,
  text: TEXT,
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect: SHRINK, resolve: null, text: TEXT },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" }, otherOnly: true },
      targets: [],
      effect: SHRINK,
      resolve: null,
      text: TEXT,
    },
  ],
});
