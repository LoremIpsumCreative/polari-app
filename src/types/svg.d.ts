// react-native-svg-transformer turns .svg imports into components at build
// time (see metro.config.js); TypeScript needs telling separately.
declare module '*.svg' {
  import type { FC } from 'react';
  import type { SvgProps } from 'react-native-svg';

  const content: FC<SvgProps>;
  export default content;
}
