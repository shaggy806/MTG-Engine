import { defineCard } from "../define.js";

const ENTER_TEXT = "This creature enters with a +1/+1 counter on it for each Zombie card in your graveyard.";
const CAST_TEXT = "Whenever you cast a Zombie spell, create a tapped 2/2 black Zombie creature token.";

export default defineCard({
  name: "Diregraf Colossus",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Giant"],
  power: 2,
  toughness: 2,
  text: `${ENTER_TEXT}\n${CAST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        counters: { kind: "+1/+1", amount: { countInGraveyard: { subtype: "Zombie", ownedBy: "you" } } },
      },
      text: ENTER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { subtype: "Zombie" } },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 1, tapped: true },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
