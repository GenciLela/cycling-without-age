-- AlterTable
ALTER TABLE `ride_request` ADD COLUMN `decidedAt` DATETIME(3) NULL,
    ADD COLUMN `decidedByUserId` VARCHAR(191) NULL,
    ADD COLUMN `declineReason` TEXT NULL;

-- CreateIndex
CREATE INDEX `ride_request_decidedByUserId_idx` ON `ride_request`(`decidedByUserId`);

-- AddForeignKey
ALTER TABLE `ride_request` ADD CONSTRAINT `ride_request_decidedByUserId_fkey` FOREIGN KEY (`decidedByUserId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
