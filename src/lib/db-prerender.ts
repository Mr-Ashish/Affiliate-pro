/**
 * Docker/CI `next build` has no Postgres. ISR pages still prerender and
 * must not fail the image build. Runtime (Fargate) leaves this unset so
 * real DB errors still surface.
 */
export function shouldSkipDbPrerender(): boolean {
  return process.env.SKIP_DB_PRERENDER === "1";
}

export async function catalogOrEmpty<T>(
  load: () => Promise<T>,
  empty: T,
): Promise<T> {
  try {
    return await load();
  } catch (err) {
    if (!shouldSkipDbPrerender()) throw err;
    console.warn(
      "SKIP_DB_PRERENDER=1: catalog query failed during build, using empty result",
    );
    return empty;
  }
}
