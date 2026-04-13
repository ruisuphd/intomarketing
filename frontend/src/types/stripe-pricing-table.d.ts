import type { DetailedHTMLProps, HTMLAttributes } from "react";

export type StripePricingTableAttributes = HTMLAttributes<HTMLElement> & {
  "pricing-table-id"?: string;
  "publishable-key"?: string;
  "client-reference-id"?: string;
  "customer-email"?: string;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "stripe-pricing-table": DetailedHTMLProps<
        StripePricingTableAttributes,
        HTMLElement
      >;
    }
  }
}

export {};
