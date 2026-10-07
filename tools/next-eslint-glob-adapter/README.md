# Adaptador privado de glob para ESLint de Next

Paquete local privado EXTRA-010, no publicable ni sustituto general de fast-glob.
Verificación independiente final aportada con npm 11.19.0/Node 24.21.0 exactos:
npm ci previo exit 0 sobre el mismo package.json/lockfile, npm ls --all exit 0,
audit completo y de producción exit 0/cero vulnerabilidades, suite completa
403 pruebas en 24 archivos (incluidas las 25 de compatibilidad), lint sin warnings,
typecheck y build exit 0; smoke público Chromium 1/1, exit 0.
Esta actualización documental no repite comandos. Evidencia en docs/validation/quality-gates.md.

La raíz declara la devDependency `next-eslint-glob-adapter` con
`file:tools/next-eslint-glob-adapter`. El override se limita a
`@next/eslint-plugin-next → fast-glob: $next-eslint-glob-adapter`, referencia npm
al spec de esa dependencia directa. npm genera ambos enlaces al paquete de tools
y registra tinyglobby 0.2.17 en el lockfile del proyecto. Ejecutar instalación/ci
solo desde la raíz: no crear lockfile independiente ni instalar dentro de tools.
No requiere publicación, scripts extra, rutas absolutas ni hacks de node_modules.

El spec inicial `file:./tools/...` enlazó erróneamente dentro del plugin. El ensayo
`file:../../../tools/...` resolvió la raíz tras regenerar las entradas fallidas,
pero npm ls lo marcó inválido: se rechaza aunque las pruebas pasaran. La referencia
raíz final pasa tanto resolución como validación del árbol con npm.

El consumidor inspeccionado en Next 16.3.8 (`dist/utils/get-root-dirs.js`) usa
únicamente CommonJS `globSync(pattern, { onlyDirectories: true })`, con un patrón
string y separadores Windows convertidos a `/`. Los arrays de settings se procesan
por el plugin, una llamada por string; los otros valores se ignoran allí.

La entrada `index.mjs` usa imports ESM de `node:path`, `node:fs` y tinyglobby,
y exporta únicamente la función nombrada `globSync`, sin top-level await ni
export default. `main` y `exports` apuntan a esa entrada; `./package.json` queda
accesible para verificar identidad. Node **24.21.0** permite al consumidor
CommonJS de Next cargar ESM síncronamente mediante `require()` y acceder a
`namespace.globSync`. Las 25 pruebas ejercitan ese consumidor real tras npm ci.
No se deshabilita `@typescript-eslint/no-require-imports` ni se excluye el adaptador.

Se delega a tinyglobby **0.2.17** con `expandDirectories: false`: el alias directo
se rechazó en EXTRA-009 porque su default agrega subdirectorios. Se conservan rutas
relativas/absolutas, se eliminan barras finales de directorios sin destruir raíces
POSIX/Windows y se trata una raíz literal sin recorrer todo el filesystem.
No se cambian configuración ni reglas ESLint. `debug: false` evita logs de rutas.

Solo se exporta `globSync`. Patrón vacío/no string y opciones distintas de
`{ onlyDirectories: true }` fallan explícitamente para revelar cambios upstream;
no se soportan arrays directos, APIs async/stream, cwd personalizado ni otras
opciones fast-glob. Se admiten patrones literales, glob y braces del contrato
probado; esto no promete equivalencia de toda la gramática de fast-glob.

Pruebas: `tests/unit/tooling/next-eslint-glob.test.ts`, con fixtures sintéticos
OS-temp, identidad de resolución, raíces y regla real `no-html-link-for-pages`.
Reevaluar consumidor/API/defaults y pruebas ante cada actualización de Next o
tinyglobby. Retirar el override cuando upstream elimine la cadena vulnerable.
Audit cero solo describe el árbol actual, no mantenimiento futuro ni revisión.
Los errores de typecheck de guards exclusivamente de prueba fueron corregidos;
el resultado final aprobado supersede esos fallos, sin borrar su historia.
Se observó un aviso de lockfile externo del directorio padre ignorado; no se modificó.
El aviso previo de unrs-resolver postinstall sin allowScripts y la política siguen
sin cambios; los gates no validan ese postinstall. No hubo actualización global
del runtime. Validación manual, DB/pgTAP, E2E privados completos, otras plataformas
y revisión del compañero siguen pendientes; el smoke público no los sustituye.
