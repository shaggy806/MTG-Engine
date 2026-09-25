import { defineCard } from "../define.js";

const DRAW_TEXT = "Whenever an Equipment you control enters, you may draw a card.";
const METALCRAFT_TEXT =
  "Metalcraft — Equipment you control have equip {0} as long as you control three or more artifacts.";

export default defineCard({
  name: "Puresteel Paladin",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 2,
  text: `${DRAW_TEXT}\n${METALCRAFT_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Equipment" } },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  static: [
    {
      // An extra equip ability; the Equipment's own equip costs stay (ruling).
      affects: { scope: "filter", filter: { subtype: "Equipment", controlledBy: "you" } },
      condition: { kind: "metalcraft" },
      grantsActivated: [
        {
          cost: { mana: "{0}", tap: false },
          targets: ["creature-you-control"],
          effect: { kind: "attach", target: 0 },
          resolve: null,
          sorcerySpeed: true,
          text: "Equip {0}",
        },
      ],
      text: METALCRAFT_TEXT,
    },
  ],
});
