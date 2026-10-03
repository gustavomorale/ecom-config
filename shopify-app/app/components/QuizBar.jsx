/* The quiz an editor page is working on, and the way back to Home where
   quizzes are chosen. Shown only when the store has more than one quiz. */
import { useRouteLoaderData } from "react-router";

export function QuizBar() {
  const quiz = (useRouteLoaderData("routes/app") || {}).quiz;
  if (!quiz || quiz.count < 2) return null;
  return (
    <s-section>
      <s-stack direction="inline" gap="small" alignItems="center">
        <s-badge tone="info">{`Quiz ${quiz.id}`}</s-badge>
        <s-text type="strong">{quiz.name}</s-text>
        <s-text color="subdued">Changes here apply to this quiz only.</s-text>
        <s-button variant="tertiary" href="/app">All quizzes</s-button>
      </s-stack>
    </s-section>
  );
}
