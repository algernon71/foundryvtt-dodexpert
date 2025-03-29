export const races = {
    "manniska": {
        "id": "manniska",
        "name": "Människa",
        "bodyshape": "humanoid",
        "abilities": {
            "STY": "3d6",
            "STO": "3d6",
            "FYS": "3d6",
            "SMI": "3d6",
            "INT": "3d6",
            "PSY": "3d6",
            "KAR": "3d6"
        }
    }

}

export const bodyShapes = {
    "humanoid":
    {
        "meleeHit": [
            "hben",
            "vben",
            "mage",
            "bkorg",
            "harm",
            "harm",
            "varm",
            "varm",
            "huvud",
            "huvud"
        ],
        "rangeHit": [
            "hben",
            "vben",
            "mage",
            "bkorg",
            "bkorg",
            "harm",
            "varm",
            "huvud"
        ],
        "bodyParts": {
            "huvud": {
                "name": "Huvud",
                "targetName": "Huvudet",
                "baseKp": 3
            },
            "harm": {
                "name": "Höger arm",
                "targetName": "Höger arm",
                "baseKp": 2
            },
            "varm": {
                "name": "Vänster arm",
                "targetName": "Vänster arm",
                "baseKp": 2
            },
            "bkorg": {
                "name": "Bröstkorg",
                "targetName": "Bröstkorgen",
                "baseKp": 4
            },
            "mage": {
                "name": "Mage",
                "targetName": "Magen",
                "baseKp": 3
            },
            "vben": {
                "name": "Vänster ben",
                "targetName": "Vänster ben",
                "baseKp": 3
            },
            "hben": {
                "name": "Höger ben",
                "targetName": "Höger ben",
                "baseKp": 3
            }
        }
    }
}
export const abilityList = ["STY", "FYS", "SMI", "INT", "PSY", "KAR"];