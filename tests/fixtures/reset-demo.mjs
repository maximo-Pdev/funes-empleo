// Deliberately no filesystem, SQL, authentication or network imports.
throw new Error("HOSTED_RESET_DISABLED: el reset alojado recreaba credenciales conocidas. No ejecutes SQL generado previamente; revisá docs/operations/demo-credentials.md. Usá reset-local.mjs solo en el entorno local aislado, o solicitá un procedimiento alojado revisado que preserve Auth.");
