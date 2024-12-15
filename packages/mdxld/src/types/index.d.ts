export interface MDXLD {
  id?: string;
  context?: string;
  type?: string;
  graph?: any;
  language?: string;    // Specifies the primary language of the content
  list?: any[];        // Represents an ordered collection of items
  set?: Set<any>;      // Represents a unique, unordered collection
  reverse?: boolean;   // Indicates whether relationships should be reversed
  base?: string;       // Base IRI for resolving relative IRIs
  vocab?: string;      // Default vocabulary IRI for property terms
  data: Record<string, any>;
  content: string;
  [key: string]: any;  // For additional YAML-LD properties
}
