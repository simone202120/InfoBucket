// React 19 (@types/react 19) ha rimosso il namespace GLOBALE `JSX`, spostandolo
// sotto `React.JSX` per supportare più versioni di React nello stesso albero.
// Le annotazioni esistenti `: JSX.Element` nei componenti dipendono dal namespace
// globale: questo shim lo ripristina come semplice alias di `React.JSX`, così la
// migrazione a SDK 54 non richiede di modificare ogni file UI. Unico punto che
// conosce questo dettaglio di compatibilità.
import type * as React from 'react';

declare global {
  namespace JSX {
    type Element = React.JSX.Element;
    type ElementClass = React.JSX.ElementClass;
    type ElementAttributesProperty = React.JSX.ElementAttributesProperty;
    type ElementChildrenAttribute = React.JSX.ElementChildrenAttribute;
    type IntrinsicAttributes = React.JSX.IntrinsicAttributes;
    type IntrinsicClassAttributes<T> = React.JSX.IntrinsicClassAttributes<T>;
    type IntrinsicElements = React.JSX.IntrinsicElements;
    type ElementType = React.JSX.ElementType;
    type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<C, P>;
  }
}
