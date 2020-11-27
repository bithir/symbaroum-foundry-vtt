export class SymbaroumActor extends Actor {
    prepareData() {
        super.prepareData();
        this._initializeData(this.data);
        this._computeItems(this.data);
        this._computeSecondaryAttributes(this.data);
    }

    _initializeData(data) {
        data.data.combat = {
            id: null,
            name: "Armor",
            data: {
                protection: "0",
                quality: "",
                impeding: 0
            }
        };
        data.data.bonus = {
            defense: 0,
            accurate: 0,
            cunning: 0,
            discreet: 0,
            persuasive: 0,
            quick: 0,
            resolute: 0,
            strong: 0,
            vigilant: 0,
            toughness: { max: 0, threshold: 0 },
            corruption: { max: 0, threshold: 0 },
            experience: { 
				cost: 0,
				spent: 0 
			}
        };
    }

    _computeItems(data) {
        for (let item of Object.values(data.items)) {
            item.isTrait = item.type === "trait";
            item.isAbility = item.type === "ability";
            item.isMysticalPower = item.type === "mysticalPower";
            item.isRitual = item.type === "ritual";
            item.isBurden = item.type === "burden";
            item.isBoon = item.type === "boon";
            item.isPower = item.isTrait || item.isAbility || item.isMysticalPower || item.isRitual || item.isBurden || item.isBoon;
            if (item.isPower) this._computePower(this.data, item);
            item.isWeapon = item.type === "weapon";
            item.isArmor = item.type === "armor";
            item.isEquipment = item.type === "equipment";
            item.isArtifact = item.type === "artifact";
            item.isGear = item.isWeapon || item.isArmor || item.isEquipment || item.isArtifact;
            if (item.isGear) this._computeGear(this.data, item);
        }
    }

    _computeSecondaryAttributes(data) {
		
		// Health - toughness
        data.data.health.toughness.max = (data.data.attributes.strong.value > 10 ? data.data.attributes.strong.value : 10) + data.data.bonus.toughness.max;
        data.data.health.toughness.threshold = Math.ceil(data.data.attributes.strong.value / 2) + data.data.bonus.toughness.threshold;
        
        // Health - corruption
        data.data.health.corruption.threshold = Math.ceil(data.data.attributes.resolute.value / 2) + data.data.bonus.corruption.threshold;
        data.data.health.corruption.max = data.data.attributes.resolute.value + data.data.bonus.corruption.max;
        data.data.health.corruption.value = data.data.health.corruption.temporary + data.data.health.corruption.daily + data.data.health.corruption.permanent;
        
        // Exp spent on items
        // Exp minus any exp bonus from items        
        data.data.experience.spent = data.data.bonus.experience.cost + data.data.bonus.experience.spent;        
        // Exp unspent is current exp - spent - used
        data.data.experience.unspent = data.data.experience.value - data.data.experience.spent - data.data.experience.used;
        
        const activeArmor = this._getActiveArmor(data);
        data.data.combat = {
            id: activeArmor._id,
            armor: activeArmor.name,
            protection: activeArmor.data.protection,
            quality: activeArmor.data.quality,
            defense: data.data.attributes.quick.value - activeArmor.data.impeding + data.data.bonus.defense
        };
    }

    _computePower(data, item) {
		let experience = 0;
		
        if (item.isRitual) {
            item.data.actions = "Ritual"
            experience = 10;
        } else if (item.isBurden) {
            item.data.actions = "Burden"
            experience = 5 * -1; // TODO - level
        } else if (item.isBoon) {
            item.data.actions = "Boon"
            experience = 5 * 1; // TODO - level
        } else {
            let novice = "-";
            let adept = "-";
            let master = "-";
            if (item.data.novice.isActive) {
				novice = item.data.novice.action;
				experience+= 10;
			}
            if (item.data.adept.isActive) {
				adept = item.data.adept.action;
				experience+= 20;
			}
            if (item.data.master.isActive) {
				master = item.data.master.action;
				experience+= 30;
			}
			item.data.actions = `${novice}/${adept}/${master}`;

        }
		
		item.data.bonus.experience.cost = experience;
		
        this._addBonus(data, item);
    }

    _computeGear(data, item) {
        item.isActive = item.data.state === "active";
        item.isEquipped = item.data.state === "equipped";
        if (item.isActive) {
			this._addBonus(data, item);
        }
    }

    _getActiveArmor(data) {
        for (let item of Object.values(data.items)) {
            if (item.isArmor && item.isActive) {
                return item;
            }
        }
        return {
            id: null,
            name: "Armor",
            data: {
                protection: "0",
                quality: "",
                impeding: 0
            }
        };
    }

    _addBonus(data, item) {
        data.data.bonus = {
            defense: data.data.bonus.defense + item.data.bonus.defense,
            accurate: data.data.bonus.accurate + item.data.bonus.accurate,
            cunning: data.data.bonus.cunning + item.data.bonus.cunning,
            discreet: data.data.bonus.discreet + item.data.bonus.discreet,
            persuasive: data.data.bonus.persuasive + item.data.bonus.persuasive,
            quick: data.data.bonus.quick + item.data.bonus.quick,
            resolute: data.data.bonus.resolute + item.data.bonus.resolute,
            strong: data.data.bonus.strong + item.data.bonus.strong,
            vigilant: data.data.bonus.vigilant + item.data.bonus.vigilant,
            toughness: {
                max: data.data.bonus.toughness.max + item.data.bonus.toughness.max,
                threshold: data.data.bonus.toughness.threshold + item.data.bonus.toughness.threshold
            },
            corruption: {
                max: data.data.bonus.corruption.max + item.data.bonus.corruption.max,
                threshold: data.data.bonus.corruption.threshold + item.data.bonus.corruption.threshold
            },
            experience: {
				spent: data.data.bonus.experience.spent - item.data.bonus.experience.spent,
				cost:  data.data.bonus.experience.cost + item.data.bonus.experience.cost
			}
        };
    }
}
