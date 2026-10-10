import { roomCard } from "../helpers.js";
import left from "./unholy-annex.js";
import right from "./ritual-chamber.js";

// EDHREC rank 2886. A Room (rule 709.5): each door is cast on its own and
// enters unlocked; the other is unlocked by paying its mana cost as a
// sorcery.
export default roomCard("Unholy Annex // Ritual Chamber", left, right);
