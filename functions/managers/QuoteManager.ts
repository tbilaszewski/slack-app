import QuoteInterface from "./QuoteInterface";

class QuoteManager implements QuoteInterface {
  insertQuote(): void {}

  findQuotesByUser(): string[] {
    return ["1"];
  }

  findQuotes(): string[] {
    return ["1"];
  }
}

export default QuoteManager;
