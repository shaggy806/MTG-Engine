import type { TriggeredAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

/** Prowess, the way every creature with the keyword prints it. "Source" is
 * whichever creature has the ability, so the granted copy pumps the Ally it's
 * on, not Sokka. */
const prowess: TriggeredAbility = {
  trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
  targets: [],
  effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
  resolve: null,
  text: "Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)",
};

export default defineCard({
  name: "Sokka, Tenacious Tactician",
  manaCost: "{1}{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Ally"],
  power: 3,
  toughness: 3,
  keywords: ["menace"],
  text:
    "Menace, prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)\n" +
    "Other Allies you control have menace and prowess.\n" +
    "Whenever you cast a noncreature spell, create a 1/1 white Ally creature token.",
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Ally", excludeSelf: true },
      grantKeywords: ["menace"],
      grantsTriggered: [prowess],
      text: "Other Allies you control have menace and prowess.",
    },
  ],
  triggered: [
    prowess,
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "create-token", token: "Ally Token", count: 1 },
      resolve: null,
      text: "Whenever you cast a noncreature spell, create a 1/1 white Ally creature token.",
    },
  ],
});
