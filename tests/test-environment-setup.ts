import ContextProvider from './testContext';

beforeAll(async () => {
  await ContextProvider.Instance.setUpContext();
});
