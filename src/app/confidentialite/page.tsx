import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-2">
        <p className="font-title text-sm font-semibold tracking-widest text-tomate-600 uppercase">
          Données personnelles
        </p>
        <h1>Politique de confidentialité</h1>
        <p className="text-sm text-encre-muted">
          Dernière mise à jour : 19 août 2026
        </p>
      </header>

      <div className="space-y-5 text-sm leading-relaxed text-encre-muted">
        <section className="space-y-2">
          <h2 className="text-lg text-encre">1. Responsable du traitement</h2>
          <p>
            Responsable : <strong>Jennifer Leygnac</strong>.
          </p>
          <p>
            Contact RGPD : <strong>jennband@gmail.com</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-encre">2. Données collectées</h2>
          <p>
            Lors de l&apos;utilisation de Mes Recettes, nous pouvons traiter :
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>les données de compte (email, nom, image si fournie) ;</li>
            <li>les données de connexion (compte local ou Google OAuth) ;</li>
            <li>les contenus saisis (recettes, menus hebdomadaires) ;</li>
            <li>des journaux techniques nécessaires à la sécurité du service.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-encre">
            3. Finalités et bases légales
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              fournir le service (authentification, sauvegarde des recettes,
              planification) : <strong>exécution du contrat</strong> ;
            </li>
            <li>
              sécuriser la plateforme et prévenir les abus :{" "}
              <strong>intérêt légitime</strong> ;
            </li>
            <li>
              respecter les obligations légales applicables :{" "}
              <strong>obligation légale</strong>.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-encre">4. Destinataires</h2>
          <p>
            Les données sont accessibles uniquement aux personnes habilitées et
            à nos sous-traitants techniques :
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Vercel (hébergement) ;</li>
            <li>Neon / PostgreSQL (base de données) ;</li>
            <li>Google (authentification OAuth, si utilisée).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-encre">5. Durées de conservation</h2>
          <p>
            Les données sont conservées pendant la durée nécessaire au service,
            puis supprimées ou anonymisées.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              compte utilisateur : suppression après 3 ans sans connexion ;
            </li>
            <li>logs techniques : 12 mois maximum.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-encre">6. Cookies</h2>
          <p>
            Le site utilise des cookies strictement nécessaires au fonctionnement
            (session, sécurité, connexion). Ces cookies ne nécessitent pas de
            consentement préalable.
          </p>
          <p>
            En cas d&apos;ajout de mesures d&apos;audience ou de cookies marketing,
            un mécanisme de consentement sera déployé avant leur dépôt.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-encre">7. Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez des droits d&apos;accès, de
            rectification, d&apos;effacement, de limitation, d&apos;opposition et de
            portabilité.
          </p>
          <p>
            Vous pouvez exercer ces droits à l&apos;adresse suivante :{" "}
            <strong>jennband@gmail.com</strong>.
          </p>
          <p>
            En cas de difficulté, vous pouvez aussi introduire une réclamation
            auprès de la CNIL :{" "}
            <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">
              https://www.cnil.fr
            </a>
            .
          </p>
        </section>
      </div>
    </section>
  );
}
