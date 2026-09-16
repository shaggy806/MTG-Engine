import { defineCard } from "../define.js";

export default defineCard({
  name: "Kangee's Lieutenant",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird", "Soldier"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever this creature attacks, attacking creatures with flying get +1/+1 until end of turn.\n" +
    "Encore {5}{W} ({5}{W}, Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able. They gain haste. Sacrifice them at the beginning of the next end step. Activate only as a sorcery.)",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        // Every attacker with flying, whoever controls it — the card says
        // "attacking creatures", not "attacking creatures you control".
        filter: { type: "creature", attacking: true, keyword: "flying" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Whenever this creature attacks, attacking creatures with flying get +1/+1 until end of turn.",
    },
  ],
  activated: [
    {
      cost: { mana: "{5}{W}", tap: false },
      zone: "graveyard",
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "encore" },
      resolve: null,
      text: "Encore {5}{W} — Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able.",
    },
  ],
});
