import { SkillCheckDialog } from "../dialogs/SkillCheckDialog.mjs"
import { AddSkillDialog } from "../dialogs/AddSkillDialog.mjs"
import { AddMagicSchoolDialog } from "../dialogs/AddMagicSchoolDialog.mjs"
import { AddSpellDialog } from "../dialogs/AddSpellDialog.mjs"
import { AttackDialog } from "../dialogs/AttackDialog.mjs"
import { CastSpellDialog } from "../dialogs/CastSpellDialog.mjs"


import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { giveSkillExperience, removeSkillExperience } from "../skills.mjs";
import { initSkill } from "../skills.mjs";
import { magiskolor } from "../spells.mjs";
import { races, bodyShapes } from "../constants.mjs";

const sheetStyles = [
  {
    "id": "classic",
    "name": "Expert classic",
    "tabs": [
      {
        "id": "front",
        "label": "Framsida",
        "path": "systems/dodexpert/templates/actor/character/classic/front.html"
      },
      {
        "id": "back",
        "label": "Baksida",
        "path": "systems/dodexpert/templates/actor/character/classic/back.html"
      }
    ]
  }
];
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DODExpertActorSheet extends ActorSheet {
  selectableSkills = [];
  selectedSkill = null;
  selectedSkillIndex = 0;
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["dodexpert", "sheet", "actor"],
      template: "systems/dodexpert/templates/actor/expert-character-sheet.html",
      width: 800,
      height: 1000,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
    });
  }

  /** @override */
  get template() {
    return `systems/dodexpert/templates/actor/${this.actor.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;
    const permissionLevel = context.document.getUserLevel(game.user);
    switch (permissionLevel) {
      case 0:
      case 1:
        context.showSheets = game.user.isGM;

        break;
      case 2:
      case 3:
        context.showSheets = true;
        break;
    }

    // Prepare character data and items.
    switch (actorData.type) {
      case 'character':
      case 'npc':
        this._prepareItems(context);
        this._prepareCharacterData(context);
        break;
    }


    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    context.bodyShape = bodyShapes["humanoid"];
    context.game = game;
    context.isGM = game.user.isGM;
    context.sheetStyles = sheetStyles;
    context.sheet = sheetStyles[0];
    context.tabs = [];
    console.log('context:', context);
    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {

    // Handle ability scores.
    for (let [k, v] of Object.entries(context.system.abilities)) {
      v.label = game.i18n.localize('dodexpert.abilities.' + k + '.label') ?? k;
    }
    const bodyShape = bodyShapes["humanoid"];

    const kpOffset = Math.floor((context.system.health.max - 5) / 3) - 1;

    if (!context.system.body) {
      context.system.body = {};
    }
    for (let [part, v] of Object.entries(bodyShape.bodyParts)) {
      let bodyPart = context.system.body[part];
      // console.log('Building body part:' + part);
      const partMaxHealth = v.baseKp + kpOffset;
      if (!bodyPart) {
        bodyPart = {
          name: v.name,
          health: {
            max: partMaxHealth,
            value: partMaxHealth
          }
        };
        context.system.body[part] = bodyPart;
      }
      let armorList = context.items.filter(i => i.type == "armor" && i.system.bodyparts[part]);
      armorList.forEach(armor => {
        bodyPart.armor = armor.name;
        bodyPart.abs = armor.system.abs;
      });
    }

    console.log("body:", context.system.body);
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const features = [];
    const skills = {
      listTitle: 'FÄRDIGHETER',
      addTitle: 'Lägg till färdighet',
      type: 'skill',
      list: []
    };
    const spells = {
      listTitle: 'BESVÄRJELSE',
      addTitle: 'Lägg till färdighet',
      type: 'spell',
      list: []
    };
    const magicSchools = {
      listTitle: 'MAGISKOLOR',
      addTitle: 'Lägg till magiskola',
      type: 'skill',
      subtype: 'magicschool',
      list: []
    };
    const favoriteSkills = [];
    const languages = [];
    const weapons = [];
    let carriedWeight = 0;



    // Iterate through items, allocating to containers
    for (let i of context.items) {
      if (i.system.weight) {
        carriedWeight += Number(i.system.weight);
      }
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      switch (i.type) {
        case 'item':
          gear.push(i);
          break;
        case 'skill':

          initSkill(i, context);
          if (!i.system.subtype) {
            i.system.subtype = 'skill';
          }
          const subtype = i.system.subtype;

          switch (subtype) {
            case 'skill':
              skills.list.push(i);
              break;
            case 'spell':
              spells.list.push(i);
              break;
            case 'magicschool':
              magicSchools.list.push(i);
              break;
            case 'language':
              languages.push(i);
              break;
          }
          if (i.system.favorite) {
            favoriteSkills.push(i);
          }
          break;
        case 'weapon':
          weapons.push(i);
          break;
        case 'spell':
          spells.list.push(i);
          break;
      }
    }

    context.gear = gear;
    context.weapons = weapons;
    context.skills = skills;
    context.favoriteSkills = favoriteSkills;
    context.spells = spells;
    context.languages = languages;
    context.magicSchools = magicSchools;
    context.isGM = game.user.isGM;
    context.carriedWeight = carriedWeight;
    console.log('context:', context);
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    html.find('.increase-health').click(this._onIncreaseHealth.bind(this));
    html.find('.deduct-health').click(this._onDeductHealth.bind(this));
    html.find('.increase-power').click(this._onIncreasePower.bind(this));
    html.find('.deduct-power').click(this._onDeductPower.bind(this));
    // Add Inventory Item
    html.find('.add-skill').click(this._onAddSkill.bind(this));
    html.find('.attack').click(this._onAttack.bind(this));
    html.find('.cast').click(this._onCastSpell.bind(this));
    html.find('.skill-roll').click(this._onSkillRoll.bind(this));
    html.find('.use-item').click(this._onUseItem.bind(this));
    html.find('.fv-input').keyup(this._onSkillUpdate.bind(this));
    html.find('.add-experience').click(this._onSkillExperienceAdd.bind(this));
    html.find('.minus-experience').click(this._onSkillExperienceRemove.bind(this));
    html.find('.toggle-favorite').click(this._onSkillToggleFavorite.bind(this));

    new ContextMenu(html, '.skill', [
      {
        name: game.i18n.localize('dodexpert.menus.edit'),
        icon: '<i class="fas fa-edit"></i>',
        condition: element => game.user.isGM,
        callback: element => {
          const skillId = element.data("skill");
          const items = this.actor.items;
          const skill = this.actor.items.get(skillId);
          skill.sheet.render(true);
        },

      },
      {
        name: game.i18n.localize('dodexpert.menus.delete'),
        icon: '<i class="fas fa-trash"></i>',
        callback: element => {
          const skillId = element.data("skill");
          const skill = this.actor.items.get(skillId);
          skill.delete();
        },

      }
    ]);
    new ContextMenu(html, '.skill-erf', [
      {
        name: game.i18n.localize('dodexpert.menus.add-xp'),
        icon: '<i class="fas fa-plus"></i>',
        callback: element => {
          const skillId = element.data("skill");
          this.addSkillExperience(skillId);
        }

      }
    ]);
    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }
  async addSkillExperience(skillId) {

    const item = this.actor.items.get(skillId);
    if (item) {
      await giveSkillExperience(item, 1);
      this.render();
    }

  }
  async _onSkillExperienceAdd(event) {

    const a = event.currentTarget;
    const data = a.dataset;
    const actorData = this.actor.system;
    const itemId = data.skill;
    const item = this.actor.items.get(itemId);
    if (item) {
      await giveSkillExperience(item, 1);
      this.render();
    }

  }

  async _onSkillExperienceRemove(event) {

    const a = event.currentTarget;
    const data = a.dataset;
    const actorData = this.actor.system;
    const itemId = data.skill;
    const item = this.actor.items.get(itemId);
    if (item) {
      await removeSkillExperience(item, 1);
      this.render();
    }

  }
  async _onSkillToggleFavorite(event) {

    const a = event.currentTarget;
    const data = a.dataset;
    const actorData = this.actor.system;
    const itemId = $(a).parents('.item').attr('data-item-id');
    const item = this.actor.items.get(itemId);
    if (item) {
      const favorite = item.system.favorite;
      let update = {
        "system":
        {
          "favorite": !favorite
        }
      };
      await item.update(update, {});
    }

  }

  async _onDeductHealth(event) {
    const health = this.actor.system.health.value;
    let update = {
      "system": {
        "health":
          { "value": health - 1 }
      }
    };
    await this.actor.update(update, {});

  }
  async _onIncreaseHealth(event) {
    const health = this.actor.system.health.value;
    let update = {
      "system": {
        "health":
          { "value": health + 1 }
      }
    };
    await this.actor.update(update, {});

  }
  async _onDeductPower(event) {
    console.info('_onDeductPower');
    const power = this.actor.system.power.value;
    let update = {
      "system": {
        "power":
          { "value": power - 1 }
      }
    };
    await this.actor.update(update, {});

  }
  async _onIncreasePower(event) {
    console.info('_onIncreasePower');
    const power = this.actor.system.power.value;
    let update = {
      "system": {
        "power":
          { "value": power + 1 }
      }
    };
    await this.actor.update(update, {});

  }
  async _onSkillUpdate(event) {
    console.log('_onSkillUpdate', event);
    const a = event.currentTarget;
    const data = a.dataset;
    const actorData = this.actor.system;
    const itemId = $(a).parents('.item').attr('data-item-id');
    const item = this.actor.items.get(itemId);

    if (item) {
      console.log('_onSkillUpdate, item:', item);
      let update = { "system": { "fv": "15" } };
      await item.update(update, {});
      this.render();
    }
  }


  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    console.log('_onRoll', event);
    const element = event.currentTarget;
    const dataset = element.dataset;

    console.log('_onRoll dataset:', dataset);
    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  async _onUseItem(event) {


    console.log('_onUseItem, event:', event);
    const element = event.currentTarget;
    const dataset = element.dataset;
    const item = this.actor.items.get(dataset.id);
    item.use(event);
  }
  async _onAddSkill(event) {
    const header = event.currentTarget;
    const type = header.dataset.type;
    const subType = header.dataset.subtype;
    const title = header.dataset.title;

    this.dialog = new AddSkillDialog(
      {
        title: title,
        actor: this.actor,
        type: type,
        subtype: subType
      }
    );
    this.dialog.render(true, {
      renderData: {}
    });
  }
  async _onAttack(event) {
    this.dialog = new AttackDialog({ actor: this.actor });
    this.dialog.render(true, {
      renderData: {}
    });
  }
  async _onCastSpell(event) {
    this.dialog = new CastSpellDialog({ actor: this.actor });
    this.dialog.render(true, {
      renderData: {}
    });
  }
  async _onSkillRoll(event) {


    console.log('_onSkillRoll, event:', event);
    const element = event.currentTarget;
    const dataset = element.dataset;
    console.log('_onSkillRoll, dataset:', dataset);
    const item = this.actor.items.get(dataset.id);
    console.log('_onSkillRoll, item:', item);
    this.skillCheckDialog = new SkillCheckDialog({ skill: item });
    this.skillCheckDialog.render(true, {
      renderData: { skill: item }
    });
  }

  async _onSkillCreate(event) {
    console.log('_onSkillCreate, event:', event);
    const context = this.getData();
    console.log('_onSkillCreate, context:', context);

    event.preventDefault();
    const header = event.currentTarget;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `Smyga`;
    // Prepare the item object.
    const bcStat = context.data.system.abilities[this.selectedSkill.bc];
    let bc = 0;
    if (bcStat) {
      bc = bcStat.mod;
    }
    const itemData = {
      name: this.selectedSkill.name,
      type: "skill",
      system: {
        skill_id: this.selectedSkillIndex,
        fv: bc,
        erf: 0

      }
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }


}
