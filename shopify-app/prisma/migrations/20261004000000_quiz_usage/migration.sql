-- Quiz completions per shop, month and quiz (1.0, multiple quizzes).
CREATE TABLE "QuizUsage" (
    "shop" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "quiz" TEXT NOT NULL,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizUsage_pkey" PRIMARY KEY ("shop","month","quiz")
);
