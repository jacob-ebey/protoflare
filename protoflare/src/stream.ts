export function injectBeforeFirst(
  search: string,
  replace: string,
): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder(); // streaming decoder
  const encoder = new TextEncoder();

  let buffer = "";
  let injected = false;

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });

      if (!injected) {
        const idx = buffer.indexOf(search);
        if (idx !== -1) {
          const out = buffer.slice(0, idx) + replace + buffer.slice(idx);
          controller.enqueue(encoder.encode(out));
          buffer = "";
          injected = true;
          return;
        }

        // Keep only enough tail to match `search` across chunk boundaries.
        const keep = Math.max(0, search.length - 1);
        if (buffer.length > keep) {
          controller.enqueue(
            encoder.encode(buffer.slice(0, buffer.length - keep)),
          );
          buffer = buffer.slice(buffer.length - keep);
        }
        return;
      }

      // Already injected: pass through
      if (buffer.length) {
        controller.enqueue(encoder.encode(buffer));
        buffer = "";
      }
    },

    flush(controller) {
      buffer += decoder.decode(); // finalize decoder

      if (!injected) {
        const idx = buffer.indexOf(search);
        if (idx !== -1) {
          buffer = buffer.slice(0, idx) + replace + buffer.slice(idx);
        } else {
          // No match anywhere: append replacement at end
          buffer = buffer + replace;
        }
        injected = true;
      }

      if (buffer.length) controller.enqueue(encoder.encode(buffer));
      buffer = "";
    },
  });
}
