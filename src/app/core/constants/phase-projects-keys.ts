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
export const PROJECT_PHASE_TRANSLATION_KEYS: Record<string, string> = {
  DESIGN: 'PROJECTS.PHASES.DESIGN',
  DESIGN_BUILD: 'PROJECTS.PHASES.DESIGN_BUILD',
  BUILD: 'PROJECTS.PHASES.BUILD',
  BUILD_OPERATE: 'PROJECTS.PHASES.BUILD_OPERATE',
  OPERATE: 'PROJECTS.PHASES.OPERATE'
};

export const PROJECT_PHASE_COLORS: Record<ProjectPhaseCode, string> = {
  DESIGN: 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100',
  DESIGN_BUILD: 'bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100', // Usa el primary de la aplicación
  BUILD: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100', 
  BUILD_OPERATE: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
  OPERATE: 'bg-success-100 text-success-800 dark:bg-success-800 dark:text-success-100' // Usa el success más sobrio
};