import { expect } from 'vitest';
import * as chai from 'chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

// Set up Chai plugins
chai.use(sinonChai);
chai.use(chaiAsPromised);

// Make chai available globally for compatibility
global.chai = chai;
global.expect = chai.expect;

export default chai;