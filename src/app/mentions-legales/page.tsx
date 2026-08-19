import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-2">
        <p className="font-title text-sm font-semibold tracking-widest text-tomate-600 uppercase">
          Informations légales
        </p>
        <h1>Mentions légales</h1>
      </header>

      <div className="space-y-5 text-sm leading-relaxed text-encre-muted">
        <section className="space-y-2">
          <h2 className="text-lg text-encre">Éditeur du site</h2>
          <p>
            Ce site est édité par : <strong>Jennifer Leygnac</strong>.
          </p>
          <p>
            Contact : <strong>jennband@gmail.com</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-encre">Hébergement</h2>
          <p>
            L&apos;application est hébergée par Vercel Inc., 440 N Barranca Ave
            #4133, Covina, CA 91723, États-Unis.
          </p>
          <p>
            Site : <a href="https://vercel.com">https://vercel.com</a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-encre">Propriété intellectuelle</h2>
          <p>
            Les contenus (textes, éléments graphiques, logo, structure) sont
            protégés par le droit d&apos;auteur. Toute reproduction ou réutilisation
            sans autorisation préalable est interdite.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-encre">Responsabilité</h2>
          <p>
            L&apos;éditeur met en oeuvre les moyens raisonnables pour assurer
            l&apos;exactitude des informations, mais ne peut garantir l&apos;absence
            d&apos;erreurs ou d&apos;indisponibilité temporaire du service.
          </p>
        </section>
      </div>
    </section>
  );
}
