export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initLangfuse } = await import('./lib/agents/shared/LangfuseTracer');
    initLangfuse();
    console.log('[Instrumentation] Langfuse tracing initialized');
  }
}
