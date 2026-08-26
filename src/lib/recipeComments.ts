export interface RecipeComment {
  id: string;
  recipeId: string;
  userId: string;
  text: string;
  createdAt: string;
}

const RECIPE_COMMENTS_KEY = 'recipes-comments-v1';

function readComments(): RecipeComment[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = localStorage.getItem(RECIPE_COMMENTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as RecipeComment[];
  } catch {
    return [];
  }
}

function writeComments(comments: RecipeComment[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(RECIPE_COMMENTS_KEY, JSON.stringify(comments));
}

export function getRecipeComments(recipeId: string): RecipeComment[] {
  return readComments()
    .filter((comment) => comment.recipeId === recipeId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function addRecipeComment(userId: string, recipeId: string, text: string): RecipeComment {
  const next: RecipeComment = {
    id: `comment-${Date.now()}`,
    recipeId,
    userId,
    text,
    createdAt: new Date().toISOString(),
  };

  writeComments([...readComments(), next]);
  return next;
}

export function updateRecipeComment(commentId: string, userId: string, text: string): boolean {
  const trimmedText = text.trim();
  if (!trimmedText) {
    return false;
  }

  let updated = false;
  const next = readComments().map((comment) => {
    if (comment.id !== commentId || comment.userId !== userId) {
      return comment;
    }

    updated = true;
    return {
      ...comment,
      text: trimmedText,
    };
  });

  if (!updated) {
    return false;
  }

  writeComments(next);
  return true;
}

export function deleteRecipeComment(commentId: string, userId: string): boolean {
  const existing = readComments();
  const next = existing.filter((comment) => !(comment.id === commentId && comment.userId === userId));

  if (next.length === existing.length) {
    return false;
  }

  writeComments(next);
  return true;
}
