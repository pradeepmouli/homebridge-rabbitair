import * as chai from 'chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

// Set up Chai plugins
chai.use(sinonChai);
chai.use(chaiAsPromised);

const isVitest = typeof (globalThis as { vi?: unknown }).vi !== 'undefined' || process.env.VITEST === 'true';

// Avoid overwriting Vitest's expect; only provide chai globals for Mocha.
if (!isVitest) {
	global.chai = chai;
	global.expect = chai.expect;
}

export default chai;