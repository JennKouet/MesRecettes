/**
 * Layout du groupe (auth) : une carte centrée, sans le chrome de navigation
 * des pages de contenu. Le groupe est entre parenthèses, donc il n'apparaît
 * pas dans l'URL (/connexion, pas /auth/connexion).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-8">
      {children}
    </div>
  );
}
