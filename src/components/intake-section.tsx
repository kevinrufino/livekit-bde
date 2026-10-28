import { IntakeForm } from '@/components/intake-form';
import { launch } from '@/content/launch';

/** "Book your first séance" — pitch on the left, intake form on the right. Anchor: #intake */
export function IntakeSection() {
  const { intake } = launch;

  return (
    <section id="intake" aria-labelledby="intake-title" className="bg-dot-pattern border-t">
      <div className="mx-auto grid w-full max-w-5xl gap-12 px-6 py-24 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <div className="flex flex-col gap-6 lg:sticky lg:top-12 lg:self-start">
          <p className="font-mono text-xs text-fgAccent1 uppercase">{intake.eyebrow}</p>
          <h2 id="intake-title" className="font-display text-4xl text-balance text-fg0">
            {intake.headline}
          </h2>
          <p className="text-lg text-fg2">{intake.body}</p>

          <ol className="mt-2 flex flex-col border-t">
            {intake.steps.map((step, i) => (
              <li key={step} className="flex gap-4 border-b py-4">
                <span className="pt-1 font-mono text-xs text-fgAccent1">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-fg1">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Centered so the shorter confirmation sits in the middle of the card. */}
        <div className="flex flex-col justify-center border bg-bg1 p-6 sm:p-8">
          <IntakeForm />
        </div>
      </div>
    </section>
  );
}
