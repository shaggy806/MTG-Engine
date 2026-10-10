import { defineCard } from "../define.js";
import { ROOM_REMINDER, unlockThisDoor } from "../helpers.js";

// The right door of Greenhouse // Rickety Gazebo (greenhouse-rickety-gazebo.ts). "From among them": the cards milled this way only.
const UNLOCK = "When you unlock this door, mill four cards, then return up to two permanent cards from among them to your hand.";

export default defineCard({
  name: "Rickety Gazebo",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${UNLOCK}\n${ROOM_REMINDER}`,
  triggered: [
    {
      trigger: unlockThisDoor("right"),
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 4 },
          {
            kind: "look-and-choose",
            zone: "graveyard",
            min: 0,
            max: 2,
            destination: "hand",
            leftover: "stay",
            filter: {
              thisWay: "milled",
              typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"],
            },
          },
        ],
      },
      resolve: null,
      text: UNLOCK,
    },
  ],
  faces: ["Greenhouse // Rickety Gazebo", "Greenhouse", "Rickety Gazebo"],
  split: true,
});
