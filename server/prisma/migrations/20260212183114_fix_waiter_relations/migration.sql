/*
  Warnings:

  - You are about to drop the column `handledBy` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `claimedBy` on the `Order` table. All the data in the column will be lost.
  - The primary key for the `Waiter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Waiter` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Call" DROP COLUMN "handledBy",
ADD COLUMN     "handledById" INTEGER;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "claimedBy",
ADD COLUMN     "claimedById" INTEGER;

-- AlterTable
ALTER TABLE "Waiter" DROP CONSTRAINT "Waiter_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Waiter_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "Waiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "Waiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
