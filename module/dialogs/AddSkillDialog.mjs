
function compareNumbers(a, b) {
  return a - b;
}
export class AddSkillDialog extends FormApplication {


  constructor(actor, data) { // myObject is the object your app modifies, such as an Actor or Item
    super(actor, data, {
      title: data.title
    });
    this.actor = actor;
    this.data = data;
    this.search = '';
    this.selectedSkill = null;
    this.selectedSkillIndex = -1;
    this.selectedSkillElement = null;
    this.addedSkills = [];
    this.getActorMagicSchools();
    console.info("shools:", this.data.magicSchools);
  }

  /**
   * @override
   */
  static get defaultOptions() {
    const defaults = super.defaultOptions;

    const overrides = {
      closeOnSubmit: false,
      height: 800,
      width: 600,
      id: 'skill-check-dialog',
      submitOnChange: true,
      template: "systems/dodexpert/templates/dialog/add-skill-dialog.html",
      title: 'Slå för färdighet',
      userId: game.userId,
    };

    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

    return mergedOptions;
  }

  /**
   * Callback passed to Button Click event listener which handles it
   * 
   * @param {MouseEvent} event - the triggering mouse click event
   */
  async _handleButtonClick(event) {
    const clickedElement = $(event.currentTarget);
    const action = clickedElement.data().action;

  }

  /**
   * @override
   */
  activateListeners(html) {
    super.activateListeners(html);

    const t = this;
    this.inputElement = document.querySelector('#skill-search-input'); // html.find('#skill-search-input');
    document.querySelector('#add-skill-button').addEventListener("click", this.addSkill.bind(this));
    this.inputElement.addEventListener("input", this._onUpdateSearch.bind(this));
    this.inputElement.addEventListener("keydown", function (e) {
      if (e.keyCode == 40) {
        t.selectNextSkill();
      } else if (e.keyCode == 38) { //up
        t.selectPreviousSkill();
      } else if (e.keyCode == 13) {
        t.addSkill();
      }
    });
    this.matchListElement = document.querySelector('#skill-match-list');
    this.selectedSkillInfoElement = document.querySelector('#add-selected-skill');
    const allItems = Items.instance;
    this.updateMatchList('');
  }

  _onUpdateSearch(event) {
    console.info('_onUpdateSearch', event);

    this.updateMatchList(this.inputElement.value);
  }


  sortOrder(item) {
    if (item.system.sortorder) {
      return Number(item.system.sortorder);
    }

    return 10;
  }
  async filterMatches(searchString) {
    const resultsList = [];
    this.matchedSkills = [];

    game.items.forEach((item, key) => {
      if (this.matchItem(item, searchString)) {
        this.matchedSkills.push(item);
      }
    });

    const skillsPack = game.packs.get(this.data.pack);
    game.packs.forEach(async gamePack => {
      const index = await gamePack.getIndex({ fields: this.getFields() });
      index.forEach((item, key) => {
        if (this.matchItem(item, searchString)) {
          item.pack = gamePack;
          this.matchedSkills.push(item);
        }
      });
      this.matchedSkills.sort((a, b) => compareNumbers(this.sortOrder(a), this.sortOrder(b)));
      this.populateMatchList();
    });

  }

  getActorMagicSchools() {
    this.data.magicSchools = {};
    this.actor.items.forEach(item => {
      if (item.type == "skill" && item.system.category == "MAG") {
        console.info('school:', item);
        this.data.magicSchools[item.system.schoolId] = item;
      }
    });
  }
  getFields() {
    switch (this.data.deftype) {
      case "skilldef":
        return ["system.category", "system.cost", "system.ability", "system.type", "system.sortorder"];
      case "spelldef":
        return ["system.school", "system.level", "system.quick", "system.ritual", "system.physical", "system.sortorder"];

      default:
        return [];
    }
  }

  matchItem(item, searchString) {
    if (item.type != this.data.deftype) {
      return false;
    }
    const subtype = item.system.category;
    if (subtype) {

      if (this.data.includeSubtypes && !this.data.includeSubtypes.find(st => subtype == st)) {
        return false;

      }
      if (this.data.excludeSubtypes && this.data.excludeSubtypes.find(st => subtype == st)) {
        return false;

      }
    }
    if (!item.name.toLowerCase().includes(searchString.toLowerCase())) {
      return false;
    }

    for (const existingItem of this.addedSkills) {
      if (existingItem.name === item.name) {
        return false;
      }

    }
    for (const existingItem of this.actor.items.values()) {
      if (existingItem.name === item.name) {
        return false;
      }
    }

    if (item.type == "spelldef") {
      const schoolSkill = this.data.magicSchools[item.system.school];
      if (!schoolSkill) {
        return false;
      }
      if (item.system.level > schoolSkill.system.fv) {
        return false;
      }
    }

    return true;
  }
  async updateMatchList(searchString) {
    await this.filterMatches(searchString);

  }

  async populateMatchList() {
    this.clearSelect();
    this.matchListElement.innerHTML = "";
    let innerElement = "";
    const t = this;
    this.matchEntryElements = [];

    this.matchedSkills.forEach((skill, index) => {
      const matchEntry = document.createElement('DIV');
      matchEntry.innerHTML = t.buildMatchEntryHTML(skill, index, false);
      matchEntry.addEventListener("click", function (e) {
        t.selectSkill(index);
      });
      matchEntry.addEventListener("dblclick", function (e) {
        t.selectSkill(index);
        t.addSkill(e);
      });
      this.matchListElement.appendChild(matchEntry);
      this.matchEntryElements.push(matchEntry);

    });
    if (this.matchEntryElements.length > 0) {
      this.selectNextSkill();
    }
  }

  buildMatchEntryHTML(skill, index, selected) {
    switch (skill.type) {
      case "spelldef":
        return this.buildSpellMatchEntryHTML(skill, index, selected);

      case "skilldef":
      default:
        return this.buildSkillMatchEntryHTML(skill, index, selected);
    }
    return `
    <div class="skill-match-entry" id="skill-match-entry-${index}">
      <div class="skill-match-name">${skill.name}</div>
      <div class="skill-match-ability">${skill.system.ability}</div>
      <div class="skill-match-cost">${skill.system.cost}</div>
      <div class="skill-match-type">${skill.system.type}-färdighet</div>
      <div class="skill-match-type">${skill.system.category}</div>
    </div>
    `;
  }
  buildSkillMatchEntryHTML(skill, index, selected) {
    return `
    <div class="skill-match-entry" id="skill-match-entry-${index}">
    
      <div class="skill-match-name">${skill.name}</div>
      <div class="skill-match-ability">${skill.system.ability}</div>
      <div class="skill-match-cost">${skill.system.cost}</div>
      <div class="skill-match-type">${skill.system.type}-färdighet</div>
      <div class="skill-match-type">${skill.system.category}</div>
    </div>
    `;
  }
  buildSpellMatchEntryHTML(skill, index, selected) {

    return `
    <div class="skill-match-entry" id="skill-match-entry-${index}">
      <div class="skill-match-name">${skill.name}</div>
      <div class="skill-match-ability">${skill.system.school}</div>
      <div class="skill-match-cost">${skill.system.level}</div>
    </div>
    `;
  }


  _onUpdateSettings(event) {
    this.mod = this.modElement.val();
    this.calculate();
  }




  selectPreviousSkill() {
    if (this.selectedSkillIndex < 0) {
      return;
    }

    this.selectSkill(this.selectedSkillIndex - 1);
  }
  selectNextSkill() {
    if (this.selectedSkillIndex >= this.matchedSkills.length) {
      return;
    }

    this.selectSkill(this.selectedSkillIndex + 1);
  }

  clearSelect() {
    if (this.selectedSkill) {
      const element = document.querySelector('#skill-match-entry-' + this.selectedSkillIndex);
      element.classList.remove("selected-skill-entry");
    }
    this.selectedSkill = null;
    this.selectedSkillIndex = -1;
    this.selectedSkillElement = null;
    this.selectedSkillInfoElement.style.display = 'none';

  }
  async selectSkill(index) {
    if (this.selectedSkill) {
      const element = document.querySelector('#skill-match-entry-' + this.selectedSkillIndex);
      element.classList.remove("selected-skill-entry");
    }
    const skill = this.matchedSkills[index];
    let skillObject = null;
    this.selectedSkill = skill;
    this.selectedSkillIndex = index;
    if (skill.pack) {
      skillObject = await skill.pack.getDocument(this.selectedSkill._id);
    } else {
      skillObject = game.items.get(this.selectedSkill._id);
    }

    const element = document.querySelector('#skill-match-entry-' + index);
    //    element.innerHTML = this.buildMatchEntryHTML(skill, index, true);
    element.classList.add("selected-skill-entry");

    this.selectedSkillInfoElement.innerHTML = this.renderSkillDescription(skillObject);

    this.selectedSkillInfoElement.style.display = 'block';
  }

  renderSkillDescription(skill) {
    if (skill.type == "spell") {
      return this.renderSpellDescription(skill);
    }
    let innerHtml = `
    <div class="selected-skill-name">${skill.name}</div>
    <div class="selected-skill-cost">Kostnad: ${skill.system.cost}</div>
    <div class="selected-skill-ability">Grundegenskap: ${skill.system.ability}</div>
    <div class="selected-skill-type">Typ: ${skill.system.type}-färdighet</div>`;
    if (skill.bc) {
      innerHtml += `<div class="selected-skill-type">BC: ${skill.system.ability}</div>`;
    } else {
      innerHtml += `<div class="selected-skill-type">BC: 0</div>`;
    }
    innerHtml += `<div class="selected-skill-description"> ${skill.system.description}</div>`;
    return innerHtml;
  }

  renderSpellDescription(skill) {
    let letters = [];
    if (skill.system.quick) {
      letters.push("K");
    }
    if (skill.system.physical) {
      letters.push("F");
    }
    if (skill.system.ritual) {
      letters.push("R");
    }
    let name = skill.name;
    if (letters.length > 0) {
      name += "(" + letters.join(",") + ")";
    }
    let innerHtml = `
    <div class="selected-skill-name">${skill.name}</div>
    <div class="selected-skill-attribute">Skolvärde: ${skill.system.level} (Kostnad: ${skill.system.cost})</div>
    <div class="selected-skill-attribute">Skola: ${skill.system.school}</div>
    <div class="selected-skill-attribute">Räckvidd: ${skill.system.range}</div>
    <div class="selected-skill-attribute">Varaktighet: ${skill.system.duration}</div>
    <div class="selected-skill-description"> ${skill.system.description}</div>`;
    return innerHtml;
  }

  async addSkill(event) {
    const skillsPack = game.packs.get(this.data.pack);
    const skill = await skillsPack.getDocument(this.selectedSkill._id);
    console.info('addSkill:', skill);
    //    const itemData = game.items.fromCompendium(skill);
    const itemData = {
      name: skill.name,
      type: this.data.type,
      system: {
        def_id: skill._id,
        def_pack: this.data.pack,
        category: skill.system.category,
        cost: skill.system.ability,
        cost: skill.system.cost,
        fv: 0,
        erf: 0
      }
    };
    console.info('itemData:', itemData);
    this.addedSkills.push(itemData);
    // await game.items.importFromCompendium(skillsPack, this.selectSkill._id, {}, { parent: this.actor });
    // await this.actor.createEmbeddedDocuments("Item", [itemData]);
    const newSkill = await Item.create(itemData, { parent: this.actor });

    this.inputElement.value = "";
    this.updateMatchList('');
    // this.close();
  }
  /**
   * @override
   */
  getData(options) {
    const context = super.getData();
    const renderData = options.renderData;

    context.actor = this.actor;

    return context;
  }

  /**
   * @override
   */
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData);


  }
}


