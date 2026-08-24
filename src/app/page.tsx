import { ButtonLink } from "./components/ui/Button";

export default function Home() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col items-start gap-5 py-8">
        <span className="rounded-full bg-safran-100 px-3 py-1 font-title text-xs font-semibold tracking-widest text-safran-700 uppercase">
          Recettes &amp; menus
        </span>
        <h1>
          Un atelier pour vos recettes,
          <br />
          un menu pour votre semaine.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-encre-muted">
          Rassemblez vos recettes au même endroit, parcourez celles des autres,
          et composez le menu de votre semaine.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <ButtonLink href="/recettes">Voir les recettes</ButtonLink>
          <ButtonLink href="/menu" variant="ghost">
            Mon menu de la semaine
          </ButtonLink>
        </div>
      </section>

      <section className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-3">
        <Feature
          icon="📖"
          title="Des recettes structurées"
          description="Ingrédients avec quantités et unités, étapes numérotées, temps de préparation et de cuisson."
        />
        <Feature
          icon="🔎"
          title="Retrouvées en un instant"
          description="Une recherche et des catégories — entrée, plat, dessert, végétarien — pour ne plus jamais fouiller."
        />
        <Feature
          icon="🗓️"
          title="Le menu, décidé une fois"
          description="Sept jours, deux repas. Vous assignez vos recettes, le reste de la semaine se passe de discussion."
        />
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <article className="card flex h-full flex-col gap-2 p-6">
      <span aria-hidden className="text-2xl">
        {icon}
      </span>
      <h2 className="text-lg sm:text-xl">{title}</h2>
      <p className="flex-1 text-sm leading-relaxed text-encre-muted">
        {description}
      </p>
    </article>
  );
}
