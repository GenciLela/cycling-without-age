-- CreateTable
CREATE TABLE `ride_request` (
    `id` VARCHAR(191) NOT NULL,
    `chapterId` VARCHAR(191) NOT NULL,
    `passengerId` VARCHAR(191) NOT NULL,
    `requestedByUserId` VARCHAR(191) NOT NULL,
    `preferredDate` DATE NOT NULL,
    `timeOfDay` ENUM('morning', 'afternoon', 'any') NOT NULL,
    `note` TEXT NULL,
    `status` ENUM('requested', 'confirmed', 'declined', 'cancelled', 'completed') NOT NULL DEFAULT 'requested',
    `cancelledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ride_request_chapterId_preferredDate_idx`(`chapterId`, `preferredDate`),
    INDEX `ride_request_passengerId_preferredDate_idx`(`passengerId`, `preferredDate`),
    INDEX `ride_request_requestedByUserId_idx`(`requestedByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ride_request` ADD CONSTRAINT `ride_request_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ride_request` ADD CONSTRAINT `ride_request_passengerId_fkey` FOREIGN KEY (`passengerId`) REFERENCES `passenger`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ride_request` ADD CONSTRAINT `ride_request_requestedByUserId_fkey` FOREIGN KEY (`requestedByUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
