import type { DetailedHTMLProps, HTMLAttributes } from "react";

// JSX typing for the <model-viewer> custom element (defined by
// @google/model-viewer, imported lazily on click only). React 19 keeps
// intrinsic elements under React.JSX, so augment that namespace.
type ModelViewerElementProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement> & {
    src?: string;
    alt?: string;
    poster?: string;
    "camera-controls"?: boolean;
    "auto-rotate"?: boolean;
    "shadow-intensity"?: string;
    "environment-image"?: string;
    exposure?: string;
    ar?: boolean;
    "ar-modes"?: string;
  },
  HTMLElement
>;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerElementProps;
    }
  }
}

export {};
