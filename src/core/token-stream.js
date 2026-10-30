/** Cursor over report tokens. Elements consume from it, as some groups span several tokens. */
export class TokenStream {
  #tokens;
  #position = 0;

  constructor(tokens) {
    this.#tokens = tokens;
  }

  get position() {
    return this.#position;
  }

  get done() {
    return this.#position >= this.#tokens.length;
  }

  peek(offset = 0) {
    return this.#tokens[this.#position + offset];
  }

  next() {
    return this.#tokens[this.#position++];
  }

  advance(count) {
    this.#position += count;
  }

  /** Consumes the next token if it matches, and returns the match. */
  take(pattern) {
    if (this.done) return null;

    const match = pattern.exec(this.peek());
    if (match) this.#position++;
    return match;
  }

  /** Consumes every remaining token. */
  rest() {
    const remaining = this.#tokens.slice(this.#position);
    this.#position = this.#tokens.length;
    return remaining;
  }

  /** Returns the tokens consumed since `start`, as they appear in the report. */
  textFrom(start) {
    return this.#tokens.slice(start, this.#position).join(' ');
  }
}
