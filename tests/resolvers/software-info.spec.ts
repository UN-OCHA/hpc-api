import { version as softwareVersion } from '../../package.json';
import ContextProvider from '../testContext';

const testSoftwareInfo =
  (version: boolean, title: boolean, status: boolean) => async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: `query { softwareInfo { ${title ? 'title' : ''} ${
          status ? 'status' : ''
        } ${version ? 'version' : ''} } }`,
      });

    expect(response).toBeDefined();
    expect(response.errors).toBeUndefined();
    expect(response.data).toBeDefined();

    const data = response.data;
    expect(data?.softwareInfo).toBeDefined();
    expect(data?.softwareInfo.length).toBeGreaterThan(0);
    const softwareInfo = data?.softwareInfo[0];

    if (version) {
      expect(softwareInfo.version).toBe(softwareVersion);
    } else {
      expect(softwareInfo.version).toBeUndefined();
    }

    if (title) {
      expect(softwareInfo.title).toBeDefined();
    } else {
      expect(softwareInfo.title).toBeUndefined();
    }

    if (status) {
      expect(softwareInfo.status).toBeDefined();
    } else {
      expect(softwareInfo.status).toBeUndefined();
    }
  };

describe('Query should return Software info', () => {
  test('All data should be returned', testSoftwareInfo(true, true, true));

  test('Only version should be returned', testSoftwareInfo(true, false, false));

  test('Only title should be returned', testSoftwareInfo(false, true, false));

  test('Only status should be returned', testSoftwareInfo(false, false, true));
});
