// Contains game data

const core = {
    settlements: {
        farm: {
            name: 'Farming settlement',
            terrain: 'grassland',
            produces: 'food'
        },
        pasture: {
            name: 'Pastural settlement',
            terrain: 'steppe',
            produces: 'food'
        },
        timber: {
            name: 'Timber settlement',
            terrain: 'forest',
            produces: 'wood'
        },
        /*mining: {
            name: 'Mining settlement',
            terrain: 'mountains',
            bonuses: [
                'iron_production':
                'stone'
            ]
        },*/
        fishing: {
            name: 'Fishing settlement',
            requires_terrain: 'sea',
            bonuses: {
                fish_production: 1.5
            }
        }
    },
    terrain: {
        grassland: {
            name: 'Grassland',
            description: 'Fertile flat land covered in tall grasses',
            fertility: 5,
            sprite_index: [0, 0],
            is_land: true
        },
        forest: {
            name: 'Forest',
            description: 'Fertile land covered in trees and small clearings.',
            fertility: 3,
            sprite_index: [1, 0],
            is_land: true
        },
        steppe: {
            name: 'Steppe',
            description: 'Flat land covered in short grasses unsuitable for agriculture',
            fertility: 1,
            sprite_index: [2, 0],
            is_land: true
        },
        desert: {
            name: 'Desert',
            description: 'Dry infertile flat land',
            fertility: 0,
            sprite_index: [3, 0],
            is_land: true
        },
        mountains: {
            name: 'Mountains',
            description: 'Steep cliffs and small lakes make this terrain nearly impassable.',
            fertility: 0,
            sprite_index: [4, 0],
            is_land: true
        },
        sea: {
            name: 'Sea',
            description: 'Rough salty waters',
            fertility: 0,
            sprite_index: [0, 1],
            is_land: false
        }
    },
    sprites: {
        settlement: {
            sprite_index: [0, 0]
        },
        city: {
            sprite_index: [1, 0]
        },
        castle: {
            sprite_index: [2, 0]
        },
        army: {
            sprite_index: [3, 0]
        }
    },
    world_gen: {
        scale: 8,
        width: 500,
        height: 500,
        max_precipitation: 3,
        max_elevation: 10,
        min_spawn_distance: 20,
        // x = precipitation, y = elevation
        terrain_grid: [
            ['sea', 'sea', 'sea'],
            ['sea', 'sea', 'sea'],
            ['sea', 'sea', 'sea'],
            ['desert', 'grassland', 'grassland'],
            ['steppe', 'grassland', 'forest'],
            ['steppe', 'forest', 'forest'],
            ['mountains', 'mountains', 'mountains'],
            ['mountains', 'mountains', 'mountains'],
            ['mountains', 'mountains', 'mountains'],
            ['mountains', 'mountains', 'mountains']
        ]
    },
    default_bonuses: {
        city_growth: 1,
        settlement_growth: 1,
        grain_production: 1,
        fish_production: 1,
        stone_production: 1,
        wood_production: 1,
        iron_production: 1,
        settlement_range: 1
    },
    civilizations: {
        chinese: {
            name: "Chinese",
            bonuses: {
                city_growth: {
                    name: "Large cities",
                    description: "City populations grow 50% faster",
                    value: 1.5
                }
            }
        },
        egpytian: {
            name: "Egyptian",
            bonuses: {
                grain_production: {
                    name: " Flood irrigation",
                    description: "Farms produce 50% more grain",
                    value: 1.5
                }
            }
        },
        phoenecian: {
            name: "Phoenecian",
            bonuses: {
                settlement_range: {
                    name: "Prolific colonies",
                    description: "Settlements can be placed 50% further from nearest city",
                    value: 1.5
                }
            }
        }
    }
}