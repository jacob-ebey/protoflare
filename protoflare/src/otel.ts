import * as otel from "@opentelemetry/api";

export function traceable<
  F extends (this: otel.Span, ...args: any) => Promise<any>,
>(tracer: otel.Tracer, name: string, func: F) {
  return ((...args: Parameters<F>) =>
    tracer.startActiveSpan(
      name,
      async (span): Promise<Awaited<ReturnType<F>>> => {
        try {
          const result = await func.apply(span, args);
          span.setStatus({ code: otel.SpanStatusCode.OK });
          return result;
        } catch (reason) {
          let message;
          if (reason && typeof reason === "object" && reason instanceof Error) {
            message = reason.message;
            span.recordException(reason);
          } else {
            message = String(message);
          }
          span.setStatus({ code: otel.SpanStatusCode.ERROR, message });
          throw reason;
        } finally {
          span.end();
        }
      },
    )) as (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>>;
}
