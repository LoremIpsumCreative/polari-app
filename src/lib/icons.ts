// Shared typing for Tabler icons.
//
// Icons are imported one file at a time — `import IconHeart from
// '@tabler/icons-react-native/IconHeart'` — rather than from the package
// barrel, which re-exports 6,147 of them. Pulling the barrel in made
// TypeScript exceed its call stack on a plain `tsc --noEmit`, which is why the
// typecheck script had to raise --stack-size to run at all.
//
// The props type has no per-icon module to come from, and the package's own
// types entry is not reachable as a subpath. Deriving it from an icon
// component avoids inventing a specifier that resolves for TypeScript but not
// at runtime, and keeps it correct automatically if the package changes shape.
import type IconHeart from '@tabler/icons-react-native/IconHeart';

/** Props accepted by every Tabler icon. */
export type IconProps = React.ComponentProps<typeof IconHeart>;
