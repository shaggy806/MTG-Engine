import { defineCard } from "../define.js";

const ENTER_TEXT =
  "This creature enters with a number of +1/+1 counters on it equal to the number of land cards in all graveyards.";
const RETURN_TEXT =
  "Whenever a land card is put into a graveyard from anywhere, you may pay {G}{G}. If you do, return this card from your graveyard to your hand.";

// The return is a graveyard ability (rule 113.6k). A "from anywhere"
// trigger looks forward, not back (rule 603.6c), so it fires when this card
// and a land card reach graveyards together (the ruling).
export default defineCard({
  name: "Centaur Vinecrasher",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant", "Centaur"],
  power: 1,
  toughness: 1,
  keywords: ["trample"],
  text: `Trample\n${ENTER_TEXT}\n${RETURN_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        counters: { kind: "+1/+1", amount: { countInGraveyard: { type: "land" } } },
      },
      text: ENTER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "put-into-graveyard", who: "any", filter: { type: "land" } },
      fromGraveyard: true,
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {G}{G} to return Centaur Vinecrasher to your hand?",
        cost: "{G}{G}",
        effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
      },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
