interface QuoteInterface {
  insertQuote(): void;
  findQuotesByUser(): Array<string>;
  findQuotes(): Array<string>;
}

export default QuoteInterface;