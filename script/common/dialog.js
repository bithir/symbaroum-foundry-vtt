import { rollAttribute } from "./roll.js";

let roll_defaults = {};

export async function prepareRollAttribute(character, attribute, armor, weapon) {
	let attri_defaults = getRollDefaults(attribute.name,armor != null, weapon != null);
	
    const html = await renderTemplate("systems/symbaroum/template/chat/dialog.html", { 
		"hasTarget": game.user.targets.values().next().value !== undefined,
	    "isArmorWeaponRoll": (armor !== null | weapon !== null),
	    "isWeaponRoll" : weapon !== null,
		"choices": { "0": game.i18n.localize("DIALOG.FAVOUR_NORMAL"), "-1":game.i18n.localize("DIALOG.FAVOUR_DISFAVOUR"), "1":game.i18n.localize("DIALOG.FAVOUR_FAVOUR")},
		"groupName":"favour",
		"roll_defaults": attri_defaults
		});
    let dialog = new Dialog({
        title: attribute.name,
        content: html,
        buttons: {
            roll: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("BUTTON.ROLL"),
                callback: async (html) => {
					let dummyMod = "custom";			
                    if( html.find("#modifier").length > 0) {
						dummyMod = html.find("#modifier")[0].value;											
					}
					attri_defaults.targetAttribute = dummyMod;
                    const modifierName = dummyMod;
                    
                                
                    const bonus = html.find("#bonus")[0].value;   
                    attri_defaults.bonus = bonus;    
                    
                    let hasAdvantage = html.find("#advantage").length > 0;
                    if( hasAdvantage ) {
						hasAdvantage = html.find("#advantage")[0].checked;
					}					
					attri_defaults.advantage = hasAdvantage ? "selected":"";
                    const advantage = hasAdvantage; 
                                       
                    let hasDamModifier = html.find("#dammodifier").length > 0;
                    let damModifier = "";
                    if(hasDamModifier) {
						damModifier = html.find("#dammodifier")[0].value;
					}
					attri_defaults.additionalModifier = damModifier;
                    
                    let favours = html.find("input[name='favour']");
                    let fvalue = 0;
                    for ( let f of favours) {						
						if( f.checked ) fvalue = f.value;
					}
					attri_defaults.selectedFavour = ""+fvalue;			
                    const favour = fvalue;
                    
                    const modifier = getTargetAttribute(modifierName, bonus);                   
                    
                    await rollAttribute(character, attribute, favour, modifier, armor, weapon, advantage, damModifier);
                },
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize("BUTTON.CANCEL"),
                callback: () => {},
            },
        },
        default: "roll",
        close: () => {},
    });
    dialog.render(true);
}

function getRollDefaults(attributeName, isArmor, isWeapon) {
	if( roll_defaults[attributeName+":"+isArmor+":"+isWeapon] === undefined )
	{
		roll_defaults[attributeName+":"+isArmor+":"+isWeapon] = createDefaults();
	}
	return roll_defaults[attributeName+":"+isArmor+":"+isWeapon];
}

function createDefaults() {
	return {
	targetAttribute: "custom",
	additionalModifier: "",
	selectedFavour: "0",
	bonus: 0,
	advantage: "",
	 };
 }

function getTargetAttribute(attributeName, bonus) {
    const target = game.user.targets.values().next().value;
    if (target === undefined || attributeName === "custom") {
        return { name: game.i18n.localize("ATTRIBUTE.CUSTOM"), value: 10 - bonus };
    } else if (attributeName === "defense") {
        let defense = target.actor.data.data.combat.defense + target.actor.data.data.bonus.defense;
        return { name: game.i18n.localize("ARMOR.DEFENSE"), value: defense - bonus };
    } else {
        console.log(target.actor.data.data);
        const attribute = target.actor.data.data.attributes[attributeName];
        const attributeValue = attribute.value + target.actor.data.data.bonus[attributeName];
        return { name: game.i18n.localize(attribute.label), value: attributeValue - bonus };
    }
}
