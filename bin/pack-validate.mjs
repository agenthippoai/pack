#!/usr/bin/env node
import path from 'node:path';
import {
	collectManifests,
	formatErrors,
	getSchemaPath,
	validateManifestFile,
} from '../src/validate.mjs';

function usage() {
	console.log(`Usage: pack-validate [path ...]

Validate Agent Pack agent.yaml files against schema/v1/agent.json
(bundled with this package — same commit as the published schema).

  path   agent.yaml file, pack directory, or parent of packs
         (scans one level for */agent.yaml). Default: .

Schema: ${getSchemaPath()}
`);
}

const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) {
	usage();
	process.exit(0);
}

let files;
try {
	files = collectManifests(args);
} catch (err) {
	console.error(err instanceof Error ? err.message : String(err));
	process.exit(1);
}

if (files.length === 0) {
	console.error('No agent.yaml found. Pass a file, pack dir, or store packs dir.');
	process.exit(1);
}

let failed = 0;
for (const file of files) {
	const label = path.relative(process.cwd(), file) || file;
	const result = validateManifestFile(file);
	console.log(`\n=== ${label} ===`);
	if (result.error) {
		console.log('ERROR');
		console.log(` - ${result.error}`);
		failed += 1;
		continue;
	}
	if (result.ok) {
		console.log('VALID');
	} else {
		console.log('INVALID');
		for (const line of formatErrors(result.errors)) {
			console.log(line);
		}
		failed += 1;
	}
}

console.log('');
if (failed > 0) {
	console.error(`${failed}/${files.length} invalid`);
	process.exit(1);
}
console.log(`${files.length}/${files.length} valid`);
process.exit(0);
