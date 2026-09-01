export const color = {
  canvas: '#F5F3EC',
  surface: '#FFFCF6',
  ink: '#1E2420',
  muted: '#71776F',
  line: '#D8D7CF',
  action: '#E56F3D',
  actionPressed: '#C9572D',
  success: '#3E7659',
  pending: '#B47722',
  error: '#A44738',
  camera: '#111612',
  cameraChrome: 'rgba(17, 22, 18, 0.64)',
  cameraText: '#FAF8F1',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 10, control: 14, surface: 20, image: 24, round: 999 } as const;
export const motion = {
  quick: 160,
  standard: 220,
  screen: 240,
  easeOut: Easing.out(Easing.cubic),
} as const;
import { Easing } from 'react-native';
