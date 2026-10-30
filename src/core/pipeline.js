/** Shared state of one parsing run. */
export function createContext(elements) {
  const report = {};
  for (const element of elements) {
    report[element.id] = element.repeatable ? [] : null;
  }

  const warnings = [];
  return {
    report,
    unparsed: [],
    warnings,
    warn: (code, token) => warnings.push({ code, token }),
  };
}

/** Runs one element and adds the source tokens to its data. */
export function parseGroup(element, stream, context) {
  const start = stream.position;
  const data = element.parse(stream, context);
  if (data === null) return null;

  return element.repeatable ? data : { raw: stream.textFrom(start), ...data };
}

/**
 * Walks the report with the elements in report order. Each token is offered to the
 * elements from the current one forward, so optional elements can be skipped and an
 * element can never match behind the current position.
 */
export function runPipeline(stream, elements, context) {
  let position = 0;

  while (!stream.done) {
    let matched = false;

    for (let index = position; index < elements.length && !matched; index++) {
      const element = elements[index];
      const data = parseGroup(element, stream, context);
      if (data === null) continue;

      context.report[element.id] = data;
      position = element.terminal ? elements.length : index + 1;
      matched = true;
    }

    if (!matched) context.unparsed.push(stream.next());
  }

  return context;
}
