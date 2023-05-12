/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor partials.
    "systems/dodexpert/templates/actor/parts/actor-features.html",
    "systems/dodexpert/templates/actor/parts/actor-body.html",
    "systems/dodexpert/templates/actor/parts/actor-bio.html",
    "systems/dodexpert/templates/actor/parts/actor-money.html",
    "systems/dodexpert/templates/actor/parts/actor-items.html",
    "systems/dodexpert/templates/actor/parts/actor-spells.html",
    "systems/dodexpert/templates/actor/parts/actor-skills.html",
    "systems/dodexpert/templates/actor/parts/actor-weapons.html",
    "systems/dodexpert/templates/actor/character/classic/front.html",
    "systems/dodexpert/templates/actor/character/classic/back.html",
    "systems/dodexpert/templates/actor/character/classic/bio.html",
    "systems/dodexpert/templates/actor/character/classic/parts/skillsList.html",
    "systems/dodexpert/templates/actor/character/classic/parts/gearList.html",
    "systems/dodexpert/templates/actor/npc/gm-sheet.html",
    "systems/dodexpert/templates/actor/npc/skillsList.html",
    "systems/dodexpert/templates/actor/public/info.html",
    "systems/dodexpert/templates/item/item-skill-sheet.html",
    "systems/dodexpert/templates/chat/skill-check-result.html",
  ]);
};
