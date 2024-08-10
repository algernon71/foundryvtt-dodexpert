import { DODExpertSkill} from "../documents/skill.mjs"
import { Check } from "../helpers/skillchecks.mjs";

export class AttackDialog extends FormApplication {


  constructor(data) { // myObject is the object your app modifies, such as an Actor or Item
    super(data, { title: 'Attack' });
    this.data = data;
    this.data.mod = 0;

    this.data.skill = this.data.weapon.system.skill;
    this.check = new Check('Attack', 'FV', this.data.skill.system.fv);

    this.check.updateModifier('weapon', this.data.weapon.name, this.data.weapon.system.mod);
  }

  /**
   * @override
   */
  static get defaultOptions() {
    const defaults = super.defaultOptions;

    const overrides = {
      closeOnSubmit: false,
      height: '200px',
      id: 'attack-dialog',
      submitOnChange: true,
      template: "systems/dodexpert/templates/dialog/attack-dialog.html",
      title: 'Attack',
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
    if (action == 'roll') {
      this.roll();
    }

  }
  async roll() {
    this.resultElement.html('');
    this.damageResultElement.html('');
    const skill = this.data.skill;
    const result = await skill.skillRoll(this.check);
    const content = await renderTemplate("systems/dodexpert/templates/common/skill-check-result.html", result);

    this.resultElement.html(content);


    const damageResult = await this.data.weapon.rollDamage(result.result);
    const damageContent = await renderTemplate("systems/dodexpert/templates/common/damage-result.html", damageResult);
    this.damageResultElement.html(damageContent);

  }

  /**
   * @override
   */
  activateListeners(html) {
    super.activateListeners(html);

    html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    html.find('#aim-part').change(this._onAimChange.bind(this));
    html.find('#target-movement').change(this._onTargetMovementChange.bind(this));
    this.calcElement = html.find('#calculation');
    this.modElement = html.find('#mod');
    this.clElement = html.find('#cl');
    this.resultElement = html.find('#result');
    this.damageResultElement = html.find('#damage-result');
    this.rollButton = html.find('#roll-button');
  }

  _onUpdateSettings(event) {
    this.mod = this.modElement.val();
    this.calculate();
  }

  _onAimChange(event) {
    const partId = event.currentTarget.value;
    this.setAim(partId);
  }
  _onTargetMovementChange(event) {
    const movementTypeId = event.currentTarget.value;
    this.setTargetMovement(movementTypeId);
  }

  setAim(partId) {
    if (partId === 'any') {
      this.updateModifier('aim', 'Varsomhelst', '');
      return ;
    }
    const part = this.context.aimTargets.find(part => part.id === partId);
    const modName = part.name;
    this.updateModifier('aim', modName, part.mod);
  }

  setTargetMovement(movementTypeId) {
    const movementType = this.context.movementTypes.find(type => type.id === movementTypeId);
    this.updateModifier('targetMovement', movementType.name, movementType.modStr);
  }

  updateModifier(id, name, mod) {
    this.check.updateModifier(id, name, mod);
    this.updateCalculation();
  }

  async updateCalculation() {
    const calculation = await this.check.render();

    console.info('Calculation:' + calculation);
    this.calcElement.html(calculation);
  }
  /**
   * @override
   */
  getData(options) {
    const context = super.getData();
    const renderData = options.renderData;
    const targets = game.user.targets;
    
    context.actor = this.data.weapon.parent;
    context.weapon = this.data.weapon;
    context.skill = this.data.skill;
    if (context.skill) {
      context.fv = this.data.skill.system.fv;
    } else {
      context.fv = 0;
    }
    context.aim = "any";
    context.targets = [];
    context.aimable = false;
    for (const t of targets.values()) {
      context.targets.push(t);
    }

    if (context.targets.length == 1) {
      context.aimable = true;
      context.target = context.targets[0];
      context.aimTargets = [];
      const actorToken = context.actor.prototypeToken;
      const targetToken = context.target;
      const actorTransform = actorToken.transform;
      const targetTransform = targetToken.transform;

    if (context.target) {
        context.targetActor = context.target.document.actor;
        const body = context.targetActor.system.body;
        const scene = context.target.scene;
        for (const sceneToken of scene.tokens.entries()) {
        }

        if (body) {
          for (const [key, part] of Object.entries(body)) {
            const aimTarget = {
              id: key,
              name: part.name,
              mod: '-5',
              part: part
            };
            context.aimTargets.push(aimTarget);
          }
  
        }
      }

    }

    context.movementTypes = [
      {
        'id': 'still',
        'name': 'står still',
        'modStr': 'x1',
        'mod': '1'
      },
      {
        'id': 'moving',
        'name': 'går',
        'modStr': 'x3/4',
        'mod': '0.75'
      },
      {
        'id': 'running',
        'name': 'springer',
        'modStr': 'x1/2',
        'mod': '0.5'
      },
      {
        'id': 'flying',
        'name': 'flyger',
        'modStr': 'x1/4',
        'mod': '0.25'
      }

    ];
    context.targetMovement = 'still';

    const weaponCategory = context.weapon.system.category;
    switch (weaponCategory) {
      case 'range':
        context.ranged = true;
        context.range = 10;
        const token = context.actor.token ?? context.actor.getActiveTokens()[0];
        const user = game.user;
        if (token.object) {
          const target = user.targets.first();
          const ac = token.object.center;
          const tc = target.center;
          const distance = canvas.grid.measureDistance(ac, tc);
          context.range = Math.round(distance);
            
        }
        break;

      default:
        context.ranged = false;
        break;
    }

    this.context = context;
    if (context.ranged) {
      this.setTargetMovement('still');
    }

    if (context.aimable) {
      this.setAim('any');
    }
    return context;
  }

  /**
   * @override
   */
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData);
  }
}


