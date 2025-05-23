// Define los posibles códigos para las fases del proyecto
export type ProjectPhaseCode = 
  | 'DESIGN'          // Diseño
  | 'DESIGN_BUILD'    // Diseño y Construcción
  | 'BUILD'           // Construcción
  | 'BUILD_OPERATE'   // Construcción y Explotación
  | 'OPERATE';        // Explotación

// Opcional: un array con los códigos si necesitas iterarlos en algún lugar (ej. para un dropdown de filtro)
export const PROJECT_PHASE_CODES: ProjectPhaseCode[] = [
  'DESIGN',
  'DESIGN_BUILD',
  'BUILD',
  'BUILD_OPERATE',
  'OPERATE'
];

// Opcional: Mapeo de códigos a sus llaves de traducción para usarlos centralizadamente si es necesario.
// Esto también podría vivir directamente en el componente si solo se usa allí.
export const PROJECT_PHASE_TRANSLATION_KEYS: Record<ProjectPhaseCode, string> = {
  DESIGN: 'PROJECTS.PHASES.DESIGN',
  DESIGN_BUILD: 'PROJECTS.PHASES.DESIGN_BUILD',
  BUILD: 'PROJECTS.PHASES.BUILD',
  BUILD_OPERATE: 'PROJECTS.PHASES.BUILD_OPERATE',
  OPERATE: 'PROJECTS.PHASES.OPERATE'
};

export const PROJECT_PHASE_COLORS: Record<ProjectPhaseCode, string> = {
  DESIGN: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100',
  DESIGN_BUILD: 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100', // O un color intermedio, ej. teal o cyan
  BUILD: 'bg-sky-100 text-sky-700 dark:bg-sky-700 dark:text-sky-100', // Usando sky para diferenciar de DESIGN_BUILD
  BUILD_OPERATE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100', // Otro color
  OPERATE: 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100'
};