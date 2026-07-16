import Ajv2020 from 'ajv/dist/2020.js';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, '..', 'schema', 'v1', 'agent.json');

let _validate;

export function getSchemaPath() {
	return SCHEMA_PATH;
}

export function getValidator() {
	if (!_validate) {
		const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
		const ajv = new Ajv2020({ allErrors: true, strict: false });
		_validate = ajv.compile(schema);
	}
	return _validate;
}

/**
 * Resolve CLI/Action inputs to agent.yaml paths.
 * - bare file → that file
 * - directory with agent.yaml → that manifest
 * - directory without → one-level scan for child pack agent.yaml files (store layout)
 */
export function collectManifests(inputs) {
	const args = inputs.length ? inputs : ['.'];
	const out = [];
	const seen = new Set();

	for (const input of args) {
		const resolved = path.resolve(input);
		if (!existsSync(resolved)) {
			throw new Error(`Path not found: ${input}`);
		}
		const st = statSync(resolved);
		if (st.isFile()) {
			add(resolved);
			continue;
		}
		if (!st.isDirectory()) {
			continue;
		}
		const direct = path.join(resolved, 'agent.yaml');
		if (existsSync(direct)) {
			add(direct);
			continue;
		}
		for (const name of readdirSync(resolved)) {
			const cand = path.join(resolved, name, 'agent.yaml');
			if (existsSync(cand)) {
				add(cand);
			}
		}
	}

	return out;

	function add(file) {
		const abs = path.resolve(file);
		if (!seen.has(abs)) {
			seen.add(abs);
			out.push(abs);
		}
	}
}

/**
 * @returns {{ file: string, ok: boolean, errors?: object[], error?: string }}
 */
export function validateManifestFile(file) {
	const validate = getValidator();
	try {
		const raw = readFileSync(file, 'utf8');
		const doc = yaml.load(raw);
		if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
			return {
				file,
				ok: false,
				errors: [{ instancePath: '', message: 'manifest must be a YAML mapping (object)' }],
			};
		}
		const ok = validate(doc);
		return {
			file,
			ok: Boolean(ok),
			errors: ok ? undefined : [...(validate.errors ?? [])],
		};
	} catch (err) {
		return {
			file,
			ok: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}

export function formatErrors(errors) {
	return (errors ?? []).map((err) => {
		const where = err.instancePath || '/';
		const params = err.params ? ` ${JSON.stringify(err.params)}` : '';
		return ` - ${where} ${err.message}${params}`;
	});
}
