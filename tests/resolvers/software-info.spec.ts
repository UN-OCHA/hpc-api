// For clarity in this example we included our typeDefs and resolvers above our test,

import { version } from '../../package.json';
import ContextProvider from '../testContext';

describe('Query should return Software info', () => {
  it('All data should be returned', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: 'query { softwareInfo { title status version } }',
      });

    expect(response).toBeDefined();
    expect(response.errors).toBeUndefined();
    expect(response.data).toBeDefined();
    const data = response.data as any;
    expect(data.softwareInfo).toBeDefined();
    expect(data.softwareInfo.length).toBeGreaterThan(0);
    const softwareInfo = data.softwareInfo[0];
    expect(softwareInfo.version).toBe(version);
    expect(softwareInfo.title).toBeDefined();
    expect(softwareInfo.status).toBeDefined();
  });

  it('Only version should be returned', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: 'query { softwareInfo { version } }',
      });

    expect(response).toBeDefined();
    expect(response.errors).toBeUndefined();
    expect(response.data).toBeDefined();
    const data = response.data as any;
    expect(data.softwareInfo).toBeDefined();
    expect(data.softwareInfo.length).toBeGreaterThan(0);
    const softwareInfo = data.softwareInfo[0];
    expect(softwareInfo.version).toBe(version);
    expect(softwareInfo.title).toBeUndefined();
    expect(softwareInfo.status).toBeUndefined();
  });

  it('Only title should be returned', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: 'query { softwareInfo { title } }',
      });

    expect(response).toBeDefined();
    expect(response.errors).toBeUndefined();
    expect(response.data).toBeDefined();
    const data = response.data as any;
    expect(data.softwareInfo).toBeDefined();
    expect(data.softwareInfo.length).toBeGreaterThan(0);
    const softwareInfo = data.softwareInfo[0];
    expect(softwareInfo.title).toBeDefined();
    expect(softwareInfo.version).toBeUndefined();
    expect(softwareInfo.status).toBeUndefined();
  });

  it('Only status should be returned', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: 'query { softwareInfo { status } }',
      });

    expect(response).toBeDefined();
    expect(response.errors).toBeUndefined();
    expect(response.data).toBeDefined();
    const data = response.data as any;
    expect(data.softwareInfo).toBeDefined();
    expect(data.softwareInfo.length).toBeGreaterThan(0);
    const softwareInfo = data.softwareInfo[0];
    expect(softwareInfo.status).toBeDefined();
    expect(softwareInfo.version).toBeUndefined();
    expect(softwareInfo.title).toBeUndefined();
  });
});
