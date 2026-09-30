import { defineCard } from "../define.js";

const TEXT =
  'When this artifact enters or is put into a graveyard from the battlefield, create a Treasure token. (It\'s an artifact with "{T}, Sacrifice this token: Add one mana of any color.")';

export default defineCard({
  name: "Prized Statue",
  manaCost: "{2}",
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
