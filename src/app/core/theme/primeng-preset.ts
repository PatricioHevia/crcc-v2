import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

export const CustomPreset = definePreset(Aura, {
  semantic: {
    colorScheme: {
      light: {
        primary: {
          50:  '#e6eef9',
          100: '#cce0f3',
          200: '#99c1e7',
          300: '#66a3db',
          400: '#3384cf',
          500: '#3567ad', // Base light
          600: '#2e5a93',
          700: '#284e7a',
          800: '#213360',
          900: '#1b2a50',
          950: '#161f3f'
        },        success: {
          50:  '#f0f7f4',
          100: '#ddeee6',
          200: '#b8dcc9',
          300: '#8bc5a7',
          400: '#5fa988',
          500: '#4a8b6f', // Verde sobrio que complementa el azul
          600: '#3d7359',
          700: '#325e47',
          800: '#2a4c3a',
          900: '#243f31',
          950: '#142318'
        }
      },
      dark: {
        primary: {
          50:  '#e0f3fb',
          100: '#c1e7f7',
          200: '#83cff0',
          300: '#46b8e9',
          400: '#08a1e2',
          500: '#0c7bb5', // Base dark
          600: '#0a6b9f',
          700: '#085b89',
          800: '#074a73',
          900: '#053958',
          950: '#042a45'
        },        success: {
          50:  '#f1f8f5',
          100: '#ddeee6',
          200: '#bce2d1',
          300: '#8ccdb1',
          400: '#5bb08a',
          500: '#469970', // Verde sobrio para modo oscuro
          600: '#387d5c',
          700: '#2f654b',
          800: '#29523e',
          900: '#244334',
          950: '#11251c'
        }
      }
    }
  },  primitive: {
    emerald: {
      50: '#f0f7f4',
      100: '#ddeee6',
      200: '#b8dcc9',
      300: '#8bc5a7',
      400: '#5fa988',
      500: '#4a8b6f', // Verde sobrio
      600: '#3d7359',
      700: '#325e47',
      800: '#2a4c3a',
      900: '#243f31',
      950: '#142318'
    },
    green: {
      50: '#f0f7f4',
      100: '#ddeee6',
      200: '#b8dcc9',
      300: '#8bc5a7',
      400: '#5fa988',
      500: '#4a8b6f', // Verde sobrio
      600: '#3d7359',
      700: '#325e47',
      800: '#2a4c3a',
      900: '#243f31',
      950: '#142318'
    }
  }
});
