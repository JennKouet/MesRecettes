import EmptyState from "./components/ui/EmptyState";
import { ButtonLink } from "./components/ui/Button";

export default function NotFound() {
  return (
    <EmptyState
      icon="🍳"
      title="Page introuvable"
      description="Cette page n'existe pas, ou la recette a été supprimée."
      action={<ButtonLink href="/recettes">Voir les recettes</ButtonLink>}
    />
  );
}
