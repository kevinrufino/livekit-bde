import { DitherWaves } from '@/components/dither-waves';
import { IntakeForm } from '@/components/intake-form';
import { VoiceOrb } from '@/components/voice-orb';
import { launch } from '@/content/launch';

/**
 * "Book your first séance". Desktop: pitch + form on the left, the agent orb on the
 * right. Mobile: the orb follows the form. A dithered wave field sits behind it all,
 * strongest where the orb is. Anchor: #intake
 */
export function IntakeSection() {
  const { intake } = launch;

  return (
    <section
      id="intake"
      aria-labelledby="intake-title"
      className="relative isolate overflow-hidden border-t"
    >
      <DitherWaves className="absolute inset-0 -z-10" />

      <div className="mx-auto grid w-full max-w-5xl gap-16 px-6 py-24 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <p className="font-mono text-xs text-fgAccent1 uppercase">{intake.eyebrow}</p>
            <h2 id="intake-title" className="font-display text-4xl text-balance text-fg0">
              {intake.headline}
            </h2>
            <p className="max-w-xl text-lg text-fg2">{intake.body}</p>
          </div>

          <div className="border bg-bg1 p-6 sm:p-8">
            <IntakeForm />
          </div>
        </div>

        <div className="flex flex-col gap-10 lg:sticky lg:top-12 lg:self-start lg:pt-28">
          <VoiceOrb />

          <ol className="flex flex-col border-t bg-bg1/85">
            {intake.steps.map((step, i) => (
              <li key={step} className="flex gap-4 border-b px-1 py-4">
                <span className="pt-1 font-mono text-xs text-fgAccent1">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-fg1">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
