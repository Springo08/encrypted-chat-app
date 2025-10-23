export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-semibold mb-6">Impressum</h1>

        <div className="space-y-4 text-foreground/80">
          <div>
            <h2 className="font-medium text-foreground mb-1">Angaben gemäß § 5 TMG</h2>
            <p>Leopold Springorum</p>
            <p>Eichweide 12</p>
            <p>82418 Seehausen am Staffelsee</p>
          </div>

          <div>
            <h2 className="font-medium text-foreground mb-1">Kontakt</h2>
            <p>E-Mail: Auf Anfrage</p>
          </div>

          <div className="pt-4 border-t">
            <a href="/" className="text-primary hover:underline">
              ← Zurück zur Startseite
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
