export const color = {
  canvas: '#F3F0EA',
  surface: '#FCFAF5',
  surfacePressed: '#E9E6E0',
  ink: '#292B30',
  muted: '#6D6F75',
  line: '#CDC9C1',
  rail: '#454A56',
  railMuted: '#E0DDE0',
  steel: '#9A9BA0',
  action: '#59677D',
  actionPressed: '#465267',
  success: '#5F7668',
  pending: '#8A6B40',
  error: '#925A58',
  camera: '#1E2126',
  cameraChrome: 'rgba(30, 33, 38, 0.82)',
  cameraInput: '#2B2F36',
  cameraLine: '#858A94',
  cameraMuted: '#C0C2C8',
  cameraText: '#FCFAF5',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 4, control: 8, surface: 10, image: 6, round: 999 } as const;
export const type = {
  ticket: 'BarlowCondensed_600SemiBold',
  ticketBold: 'BarlowCondensed_700Bold',
} as const;
export const motion = {
  quick: 140,
  standard: 240,
  screen: 280,
  easeOut: Easing.out(Easing.cubic),
} as const;
import { Easing } from 'react-native';
