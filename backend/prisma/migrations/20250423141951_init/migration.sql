-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password_hash` TEXT NOT NULL,
    `created_at` DATETIME NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GameSession` (
    `id` CHAR(36) NOT NULL,
    `host_user_id` INTEGER NOT NULL,
    `map_type` TEXT NOT NULL,
    `seed` BIGINT NOT NULL,
    `current_turn` INTEGER NOT NULL DEFAULT 1,
    `current_player` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ongoing',
    `created_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Player` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` CHAR(36) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `civ_type` VARCHAR(50) NOT NULL,
    `is_ai` BOOLEAN NOT NULL DEFAULT false,
    `player_index` INTEGER NOT NULL,

    UNIQUE INDEX `Player_session_id_player_index_key`(`session_id`, `player_index`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tech` (
    `id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `era` VARCHAR(50) NULL,
    `cost` INTEGER NOT NULL,
    `description` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Policy` (
    `id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `tree` VARCHAR(50) NOT NULL,
    `culture_cost` INTEGER NOT NULL,
    `effect_json` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Doctrine` (
    `id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `tier` INTEGER NOT NULL,
    `effect_json` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UnitType` (
    `id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) NULL,
    `move` INTEGER NULL,
    `combat_strength` INTEGER NULL,
    `range` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Terrain` (
    `id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `yield_json` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resource` (
    `id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Hexagon` (
    `session_id` CHAR(36) NOT NULL,
    `q` INTEGER NOT NULL,
    `r` INTEGER NOT NULL,
    `s` INTEGER NOT NULL,
    `terrain_id` VARCHAR(50) NULL,
    `resource_id` VARCHAR(50) NULL,
    `city_id` INTEGER NULL,
    `unit_id` INTEGER NULL,

    PRIMARY KEY (`session_id`, `q`, `r`, `s`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `City` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `owner_player_id` INTEGER NOT NULL,
    `population` INTEGER NOT NULL,
    `turns_left` INTEGER NULL,
    `food` INTEGER NULL,
    `gold` INTEGER NULL,
    `science` INTEGER NULL,
    `culture` INTEGER NULL,
    `faith` INTEGER NULL,
    `happiness` INTEGER NULL,
    `hp` INTEGER NULL,
    `defense` INTEGER NULL,
    `garrisoned_unit_id` INTEGER NULL,
    `food_to_next_pop` INTEGER NULL,
    `culture_to_next_border` INTEGER NULL,
    `specialization` VARCHAR(50) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductionQueue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `city_id` INTEGER NOT NULL,
    `item_name` VARCHAR(100) NOT NULL,
    `turns_left` INTEGER NOT NULL,
    `queue_order` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Unit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` CHAR(36) NOT NULL,
    `owner_player_id` INTEGER NOT NULL,
    `unit_type_id` VARCHAR(50) NOT NULL,
    `hp` INTEGER NULL,
    `movement` INTEGER NULL,
    `max_movement` INTEGER NULL,
    `status` VARCHAR(50) NULL,
    `loc_q` INTEGER NULL,
    `loc_r` INTEGER NULL,
    `loc_s` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GameResearch` (
    `session_id` CHAR(36) NOT NULL,
    `current_tech_id` VARCHAR(50) NULL,

    PRIMARY KEY (`session_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResearchedTech` (
    `session_id` CHAR(36) NOT NULL,
    `tech_id` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`session_id`, `tech_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResearchProgress` (
    `session_id` CHAR(36) NOT NULL,
    `tech_id` VARCHAR(50) NOT NULL,
    `progress` INTEGER NOT NULL,

    PRIMARY KEY (`session_id`, `tech_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GamePolicies` (
    `session_id` CHAR(36) NOT NULL,
    `culture` INTEGER NOT NULL,

    PRIMARY KEY (`session_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdoptedPolicy` (
    `session_id` CHAR(36) NOT NULL,
    `policy_id` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`session_id`, `policy_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GameReligion` (
    `session_id` CHAR(36) NOT NULL,
    `faith` INTEGER NOT NULL,

    PRIMARY KEY (`session_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FoundedReligion` (
    `session_id` CHAR(36) NOT NULL,
    `religion_name` VARCHAR(100) NOT NULL,
    `founder` VARCHAR(100) NULL,

    PRIMARY KEY (`session_id`, `religion_name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SelectedDoctrine` (
    `session_id` CHAR(36) NOT NULL,
    `doctrine_id` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`session_id`, `doctrine_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CivRelation` (
    `session_id` CHAR(36) NOT NULL,
    `player_id` INTEGER NOT NULL,
    `target_player_id` INTEGER NOT NULL,
    `status` VARCHAR(20) NULL,
    `relation_value` INTEGER NULL,

    PRIMARY KEY (`session_id`, `player_id`, `target_player_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CityStateRelation` (
    `session_id` CHAR(36) NOT NULL,
    `city_state_id` INTEGER NOT NULL,
    `player_id` INTEGER NOT NULL,
    `influence` INTEGER NULL,
    `is_allied` BOOLEAN NULL,

    PRIMARY KEY (`session_id`, `city_state_id`, `player_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GameEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` CHAR(36) NOT NULL,
    `turn_number` INTEGER NULL,
    `event_type` VARCHAR(50) NULL,
    `event_data` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GameSession` ADD CONSTRAINT `GameSession_host_user_id_fkey` FOREIGN KEY (`host_user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Player` ADD CONSTRAINT `Player_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `GameSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Player` ADD CONSTRAINT `Player_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Hexagon` ADD CONSTRAINT `Hexagon_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `GameSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Hexagon` ADD CONSTRAINT `Hexagon_terrain_id_fkey` FOREIGN KEY (`terrain_id`) REFERENCES `Terrain`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Hexagon` ADD CONSTRAINT `Hexagon_resource_id_fkey` FOREIGN KEY (`resource_id`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `City` ADD CONSTRAINT `City_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `GameSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `City` ADD CONSTRAINT `City_owner_player_id_fkey` FOREIGN KEY (`owner_player_id`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionQueue` ADD CONSTRAINT `ProductionQueue_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `City`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Unit` ADD CONSTRAINT `Unit_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `GameSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Unit` ADD CONSTRAINT `Unit_owner_player_id_fkey` FOREIGN KEY (`owner_player_id`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Unit` ADD CONSTRAINT `Unit_unit_type_id_fkey` FOREIGN KEY (`unit_type_id`) REFERENCES `UnitType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GameResearch` ADD CONSTRAINT `GameResearch_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `GameSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GameResearch` ADD CONSTRAINT `GameResearch_current_tech_id_fkey` FOREIGN KEY (`current_tech_id`) REFERENCES `Tech`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResearchedTech` ADD CONSTRAINT `ResearchedTech_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `GameResearch`(`session_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResearchedTech` ADD CONSTRAINT `ResearchedTech_tech_id_fkey` FOREIGN KEY (`tech_id`) REFERENCES `Tech`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResearchProgress` ADD CONSTRAINT `ResearchProgress_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `GameResearch`(`session_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResearchProgress` ADD CONSTRAINT `ResearchProgress_tech_id_fkey` FOREIGN KEY (`tech_id`) REFERENCES `Tech`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GamePolicies` ADD CONSTRAINT `GamePolicies_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `GameSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdoptedPolicy` ADD CONSTRAINT `AdoptedPolicy_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `GamePolicies`(`session_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdoptedPolicy` ADD CONSTRAINT `AdoptedPolicy_policy_id_fkey` FOREIGN KEY (`policy_id`) REFERENCES `Policy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GameReligion` ADD CONSTRAINT `GameReligion_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `GameSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FoundedReligion` ADD CONSTRAINT `FoundedReligion_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `GameReligion`(`session_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SelectedDoctrine` ADD CONSTRAINT `SelectedDoctrine_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `GameReligion`(`session_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SelectedDoctrine` ADD CONSTRAINT `SelectedDoctrine_doctrine_id_fkey` FOREIGN KEY (`doctrine_id`) REFERENCES `Doctrine`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CivRelation` ADD CONSTRAINT `CivRelation_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `GameSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CivRelation` ADD CONSTRAINT `CivRelation_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CivRelation` ADD CONSTRAINT `CivRelation_target_player_id_fkey` FOREIGN KEY (`target_player_id`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CityStateRelation` ADD CONSTRAINT `CityStateRelation_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `GameSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CityStateRelation` ADD CONSTRAINT `CityStateRelation_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GameEvent` ADD CONSTRAINT `GameEvent_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `GameSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
