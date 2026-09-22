import { defineCard } from "../define.js";

export default defineCard({
  name: "Elsha, Threefold Master",
  manaCost: "{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Djinn", "Monk"],
  power: 1,
  toughness: 1,
  keywords: ["trample"],
  text:
    "Trample\n" +
    "Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until " +
    "end of turn.)\n" +
    "Whenever Elsha deals combat damage to a player, create that many 1/1 white Monk " +
    "creature tokens with prowess.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "source",
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Prowess — whenever you cast a noncreature spell, Elsha gets +1/+1 until end of turn.",
    },
    {
      // "That many" is the combat damage this creature just dealt — the
      // trigger's own supplied value, exactly as Tana, the Bloodsower reads it.
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Monk Token",
        count: { triggerValue: true },
      },
      resolve: null,
      text:
        "Whenever Elsha deals combat damage to a player, create that many 1/1 white Monk " +
        "creature tokens with prowess.",
    },
  ],
});
