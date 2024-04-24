import ContextProvider from './testContext';

beforeAll(async () => {
  console.log('Setting up context');
  await ContextProvider.Instance.setUpContext();
});
